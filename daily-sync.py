#!/usr/bin/env python3
"""
daily-sync.py — E2E Fashion Transformation Portal: Daily OPIF Sync

What this does every run:
  1. Loads Chrome cookies to authenticate with Confluence + Jira
  2. Fetches the LLTT Confluence dashboard — extracts all OPIF IDs
  3. Scrapes each OPIF Jira page for status, target date, tech rank, owners
  4. Compares against current portal card data
  5. Writes detected changes to data-changelog.js
  6. Updates status / dates / rank on existing cards in data-*.js
  7. Detects NEW OPIFs not yet in the portal — enriches and adds them
  8. Rebuilds portal-inlined.html via build-inlined.py
  9. Publishes to puppy.walmart.com (same permanent URL)

Usage:
  python3 daily-sync.py             # full sync + publish
  python3 daily-sync.py --dry-run   # print changes only, no writes
  python3 daily-sync.py --no-publish  # sync + rebuild but skip publish

Scheduled via ~/Library/LaunchAgents/com.walmart.fashion-portal-sync.plist
"""
from __future__ import annotations
import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path
from typing import Any

import time

try:
    import http.cookiejar as cookielib
    import urllib.request as urlreq
except ImportError:
    sys.exit("Python 3.8+ required")

try:
    from teams_notify import notify_sync_complete
    _TEAMS_AVAILABLE = True
except ImportError:
    _TEAMS_AVAILABLE = False

# ── Config ────────────────────────────────────────────────────────────────────
BASE          = Path(__file__).parent
CHANGELOG_JS  = BASE / 'data-changelog.js'
LOG_FILE      = BASE / 'sync.log'
TODAY         = date.today().isoformat()

CONFLUENCE_DASHBOARD_URL = (
    'https://confluence.walmart.com/display/APREC/'
    'Long+Lead+Time+Transformation+Work+Management+Dashboard'
)
JIRA_BASE     = 'https://jira.walmart.com'
SHARE_PUPPY   = 'https://puppy.walmart.com'
PORTAL_SLUG   = 'fashion-portal'
PORTAL_OWNER  = 'e0c0lzr'

# Fields we track changes for (card key → human label)
TRACKED_FIELDS = {
    'status'    : 'Status',
    'targetDate': 'Target Date',
    'techRank'  : 'Tech Rank',
    'owners'    : 'Owners',
}

# OPIF status text → portal status key + label
STATUS_MAP = {
    'in progress'      : ('yellow',   'Yellow \u2014 Work in Progress'),
    'work in progress' : ('yellow',   'Yellow \u2014 Work in Progress'),
    'at risk'          : ('red',      'Red \u2014 At Risk'),
    'on track'         : ('green',    'Green \u2014 In Progress'),
    'green'            : ('green',    'Green \u2014 In Progress'),
    'yellow'           : ('yellow',   'Yellow \u2014 Trending Green'),
    'red'              : ('red',      'Red \u2014 At Risk'),
    'done'             : ('complete', 'Complete'),
    'completed'        : ('complete', 'Complete'),
    'closed'           : ('complete', 'Complete'),
    'roadmap'          : ('roadmap',  'Roadmap'),
    'planned'          : ('roadmap',  'Roadmap'),
    'backlog'          : ('roadmap',  'Roadmap'),
    'initial requirements': ('roadmap', 'Roadmap \u2014 Initial Requirements'),
}

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg: str) -> None:
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with LOG_FILE.open('a') as f:
        f.write(line + '\n')

# ── Chrome Cookie Extraction ──────────────────────────────────────────────────
def _get_chrome_key() -> bytes:
    """Retrieve Chrome's AES key from macOS Keychain."""
    import subprocess, base64
    result = subprocess.run(
        ['security', 'find-generic-password', '-w',
         '-s', 'Chrome Safe Storage', '-a', 'Chrome'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError('Cannot read Chrome key from Keychain')
    pw = result.stdout.strip()
    # Derive AES key using PBKDF2 with 'saltysalt', 1003 iterations
    import hashlib
    key = hashlib.pbkdf2_hmac('sha1', pw.encode(), b'saltysalt', 1003, dklen=16)
    return key

def _decrypt_chrome_cookie(enc: bytes, key: bytes) -> str:
    """Decrypt a Chrome v10 cookie value."""
    try:
        from Crypto.Cipher import AES
    except ImportError:
        return ''  # pycryptodome not installed — skip decryption
    if enc[:3] != b'v10':
        return enc.decode('utf-8', errors='replace')
    iv = b' ' * 16
    cipher = AES.new(key, AES.MODE_CBC, IV=iv)
    decrypted = cipher.decrypt(enc[3:])
    # Remove PKCS7 padding
    pad = decrypted[-1]
    return decrypted[:-pad].decode('utf-8', errors='replace')

def load_chrome_cookies(domains: list[str]) -> dict[str, str]:
    """
    Load Chrome cookies for the given domains from the macOS SQLite store.
    Returns {name: value} dict.
    """
    cookie_db = Path.home() / 'Library/Application Support/Google/Chrome/Default/Cookies'
    if not cookie_db.exists():
        log('WARNING: Chrome cookie database not found')
        return {}
    # Chrome locks the DB while running — copy it first
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        tmp_path = Path(tmp.name)
    import shutil
    shutil.copy2(cookie_db, tmp_path)
    try:
        key = _get_chrome_key()
    except Exception as e:
        log(f'WARNING: Could not get Chrome key: {e} — cookies may be empty')
        key = b''
    cookies: dict[str, str] = {}
    try:
        con = sqlite3.connect(str(tmp_path))
        domain_placeholders = ','.join('?' for _ in domains)
        rows = con.execute(
            f"SELECT host_key, name, encrypted_value FROM cookies "
            f"WHERE host_key IN ({domain_placeholders})",
            domains
        ).fetchall()
        con.close()
        for _host, name, enc_val in rows:
            val = _decrypt_chrome_cookie(enc_val, key) if key else ''
            if val:
                cookies[name] = val
    except Exception as e:
        log(f'WARNING: Cookie read error: {e}')
    finally:
        tmp_path.unlink(missing_ok=True)
    return cookies

def make_session(cookies: dict[str, str]) -> urlreq.OpenerDirector:
    """Build a urllib opener that sends the given cookies on every request."""
    cookie_jar = cookielib.CookieJar()
    opener = urlreq.build_opener(urlreq.HTTPCookieProcessor(cookie_jar))
    # Filter out cookies with non-ASCII characters that can't be sent in HTTP headers
    safe_cookies = {k: v for k, v in cookies.items() if all(ord(c) < 128 for c in v)}
    opener.addheaders = [
        ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/122.0.0.0 Safari/537.36'),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
        ('Cookie', '; '.join(f'{k}={v}' for k, v in safe_cookies.items())),
    ]
    return opener

# ── Fetch helpers ─────────────────────────────────────────────────────────────
def fetch(opener: urlreq.OpenerDirector, url: str, timeout: int = 20) -> str:
    """GET a URL and return its text body."""
    try:
        with opener.open(url, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        log(f'FETCH ERROR {url}: {e}')
        return ''

# ── Parse Confluence LLTT Dashboard ──────────────────────────────────────────
OPIF_PATTERN = re.compile(r'OPIF-\d{5,7}')

def extract_opif_ids(html: str) -> list[str]:
    """Extract all unique OPIF IDs from the dashboard page."""
    ids = list(dict.fromkeys(OPIF_PATTERN.findall(html)))  # unique, order-preserved
    return ids

# ── Parse a Jira OPIF page ────────────────────────────────────────────────────
def _text(html: str, tag: str, id_: str) -> str:
    """Extract text content of a tag with a given id."""
    m = re.search(rf'id="{id_}"[^>]*>(.*?)</', html, re.S)
    return re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''

def scrape_opif(opener: urlreq.OpenerDirector, opif_id: str) -> dict[str, Any]:
    """Scrape key fields from a Jira OPIF page."""
    url  = f'{JIRA_BASE}/browse/{opif_id}'
    html = fetch(opener, url)
    if not html:
        return {}
    result: dict[str, Any] = {'opifId': opif_id, 'url': url}

    # Title
    title_m = re.search(r'<title[^>]*>([^<]+)</title>', html)
    if title_m:
        raw = title_m.group(1).strip()
        result['title'] = re.sub(r'\s*\[OPIF-\d+\].*$', '', raw).strip()

    # Status (the workflow status badge)
    status_m = re.search(
        r'id="opsbar-transitions_more"[^>]*>\s*<span[^>]*>([^<]+)</span>', html)
    if not status_m:
        status_m = re.search(
            r'class="jira-issue-status-lozenge[^"]*"[^>]*>\s*([^<]+)<', html)
    if status_m:
        raw_status = status_m.group(1).strip().lower()
        result['rawStatus'] = raw_status
        sk, sl = STATUS_MAP.get(raw_status, STATUS_MAP.get(
            next((k for k in STATUS_MAP if k in raw_status), ''), ('', '')))
        result['status']      = sk
        result['statusLabel'] = sl

    # Due date / target date
    date_m = re.search(r'id="duedate-val"[^>]*>\s*<time[^>]+datetime="([^"]+)"', html)
    if date_m:
        try:
            d = datetime.strptime(date_m.group(1)[:10], '%Y-%m-%d')
            result['targetDate'] = d.strftime('%B %-d, %Y')
            result['quarter']    = f'Q{(d.month - 1) // 3 + 1}'
        except ValueError:
            pass

    # Priority
    prio_m = re.search(r'id="priority-val"[^>]*>.*?<img[^>]+alt="([^"]+)"', html, re.S)
    if prio_m:
        result['priority'] = prio_m.group(1).strip()

    # Assignee (rough owner)
    assignee_m = re.search(
        r'id="assignee-val"[^>]*>.*?<a[^>]+>([^<]+)</a>', html, re.S)
    if assignee_m:
        result['assignee'] = assignee_m.group(1).strip()

    return result

# ── Load current portal card state ────────────────────────────────────────────
def load_current_cards() -> dict[str, dict]:
    """Read all data-*.js files and parse out card id + key fields."""
    cards: dict[str, dict] = {}
    data_files = sorted(BASE.glob('data-*.js'))
    for f in data_files:
        if f.name == 'data-changelog.js':
            continue
        txt = f.read_text()
        # Extract card objects: { id: 'xxx', status: 'yyy', targetDate: 'zzz', ... }
        for m in re.finditer(
            r"id:\s*'([^']+)'.*?status:\s*'([^']*)'.*?targetDate:\s*'([^']*)'\s*,?",
            txt, re.S
        ):
            card_id, status, target = m.group(1), m.group(2), m.group(3)
            # Try to grab techRank
            rank_m = re.search(rf"id:\s*'{re.escape(card_id)}'.*?techRank:\s*(\d+)", txt, re.S)
            rank   = int(rank_m.group(1)) if rank_m else None
            cards[card_id] = {
                'id'        : card_id,
                'status'    : status,
                'targetDate': target,
                'techRank'  : rank,
                'source'    : f.name,
            }
    return cards

# ── Load + merge existing changelog ──────────────────────────────────────────
def load_changelog() -> dict[str, list]:
    """Parse CARD_CHANGELOG from data-changelog.js."""
    txt = CHANGELOG_JS.read_text()
    m   = re.search(r'const CARD_CHANGELOG = (\{.*?\});', txt, re.S)
    if not m:
        return {}
    try:
        # JS object → python dict (very simple — keys are strings)
        raw = m.group(1)
        raw = re.sub(r'//[^\n]*', '', raw)         # strip comments
        raw = re.sub(r'(\w+):', r'"\1":', raw)     # quote keys
        raw = re.sub(r"'([^']*)'\s*([,}\]])", r'"\1"\2', raw)  # single → double quotes
        return json.loads(raw) if raw.strip() != '{}' else {}
    except Exception:
        return {}

def write_changelog(changelog: dict[str, list]) -> None:
    """Overwrite data-changelog.js with the current changelog dict."""
    entries_js = json.dumps(changelog, indent=2, ensure_ascii=False)
    # Format as valid JS (keys as unquoted strings are fine in JS objects but
    # JSON format with double-quote keys is also valid JS)
    # Format TODAY as "March 20, 2026" style
    pretty_date = datetime.strptime(TODAY, '%Y-%m-%d').strftime('%B %-d, %Y')
    content = f'''/**
 * data-changelog.js — Auto-generated by daily-sync.py
 * Tracks card-level changes: status, targetDate, techRank, owners.
 * DO NOT EDIT MANUALLY — overwritten on every sync run.
 *
 * Last sync: {pretty_date}
 */
const LAST_SYNC_DATE = '{pretty_date}';

const CARD_CHANGELOG = {entries_js};

// Inject changeLog into every card that has entries
if (typeof allCards !== 'undefined') {{
  allCards.forEach(card => {{
    const log = CARD_CHANGELOG[card.id];
    if (log && log.length) card.changeLog = log;
  }});
}}
'''
    CHANGELOG_JS.write_text(content)

# ── Detect changes ────────────────────────────────────────────────────────────
def detect_changes(
    card_id: str,
    current: dict,
    scraped: dict,
    changelog: dict[str, list],
) -> list[dict]:
    """Compare current card vs scraped OPIF. Return list of new change entries."""
    new_entries: list[dict] = []

    def add(field: str, frm: Any, to: Any, frm_lbl: str = '', to_lbl: str = '') -> None:
        new_entries.append({
            'date'     : TODAY,
            'field'    : field,
            'from'     : str(frm),
            'to'       : str(to),
            'fromLabel': frm_lbl or str(frm),
            'toLabel'  : to_lbl or str(to),
        })

    # Status
    if scraped.get('status') and scraped['status'] != current.get('status'):
        add('status',
            current.get('status', ''), scraped['status'],
            current.get('statusLabel', ''), scraped.get('statusLabel', ''))

    # Target date
    if scraped.get('targetDate') and scraped['targetDate'] != current.get('targetDate'):
        add('targetDate', current.get('targetDate', 'TBD'), scraped['targetDate'])

    # Tech rank (Jira doesn't have this field directly — skip for now)
    # We'll detect rank changes when explicitly provided via --rank flag

    return new_entries

# ── Update a card's fields in its data-*.js file ──────────────────────────────
def patch_card_in_file(card_id: str, source_file: str, updates: dict) -> bool:
    """Apply field updates to a card in its data-*.js file. Returns True if changed."""
    path = BASE / source_file
    txt  = path.read_text()
    changed = False

    for field, new_val in updates.items():
        # Find the card block and replace the field value
        # Pattern: id: 'card-id', ..., field: 'OLD_VALUE'
        if field in ('status', 'targetDate', 'quarter'):
            pat = re.compile(
                rf"(id:\s*'{re.escape(card_id)}'.*?{field}:\s*)'([^']*)'\s*,",
                re.S
            )
            new_txt = pat.sub(rf"\g<1>'{new_val}',", txt, count=1)
            if new_txt != txt:
                txt     = new_txt
                changed = True

    if changed:
        path.write_text(txt)
    return changed

# ── Rebuild portal ────────────────────────────────────────────────────────────
def rebuild_portal() -> bool:
    log('Rebuilding portal-inlined.html...')
    result = subprocess.run(
        [sys.executable, str(BASE / 'build-inlined.py')],
        cwd=str(BASE), capture_output=True, text=True
    )
    if result.returncode != 0:
        log(f'BUILD ERROR: {result.stderr}')
        return False
    log(result.stdout.strip())
    return True

# ── Git commit ────────────────────────────────────────────────────────────────
def git_commit(msg: str) -> None:
    subprocess.run(
        ['git', 'add', '-A'], cwd=str(BASE), capture_output=True)
    subprocess.run(
        ['git', 'commit', '-m', msg], cwd=str(BASE), capture_output=True)
    log(f'Git commit: {msg}')

# ── Publish to share-puppy ────────────────────────────────────────────────────
def publish(cookies: dict[str, str], dry_run: bool = False) -> bool:
    """Upload portal-inlined.html to puppy.walmart.com via its upload API."""
    portal_file = BASE / 'portal-inlined.html'
    if not portal_file.exists():
        log('ERROR: portal-inlined.html not found')
        return False
    if dry_run:
        log('DRY RUN: skipping publish')
        return True

    # share-puppy multipart upload
    import urllib.parse
    import ssl
    boundary = '----PuppyBoundary7f3a9'
    html_bytes = portal_file.read_bytes()
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="portal-inlined.html"\r\n'
        f'Content-Type: text/html\r\n\r\n'
    ).encode() + html_bytes + (
        f'\r\n--{boundary}\r\n'
        f'Content-Disposition: form-data; name="slug"\r\n\r\n'
        f'{PORTAL_SLUG}'
        f'\r\n--{boundary}--\r\n'
    ).encode()

    upload_url = f'{SHARE_PUPPY}/api/sharing/{PORTAL_OWNER}/{PORTAL_SLUG}'
    req = urlreq.Request(
        upload_url,
        data=body,
        method='PUT',
        headers={
            'Content-Type' : f'multipart/form-data; boundary={boundary}',
            'Cookie'       : '; '.join(f'{k}={v}' for k, v in cookies.items()),
            'User-Agent'   : 'FashionPortalSync/1.0',
        },
    )
    try:
        ctx = ssl.create_default_context()
        with urlreq.urlopen(req, context=ctx, timeout=30) as r:
            resp = r.read().decode()
            log(f'Publish response: {resp[:200]}')
            return True
    except Exception as e:
        log(f'PUBLISH ERROR: {e} — trying POST fallback')
        # Fallback: try POST
        req2 = urlreq.Request(
            f'{SHARE_PUPPY}/api/sharing/upload',
            data=body,
            method='POST',
            headers={
                'Content-Type' : f'multipart/form-data; boundary={boundary}',
                'Cookie'       : '; '.join(f'{k}={v}' for k, v in cookies.items()),
                'User-Agent'   : 'FashionPortalSync/1.0',
                'X-Slug'       : PORTAL_SLUG,
                'X-Owner'      : PORTAL_OWNER,
            },
        )
        try:
            with urlreq.urlopen(req2, context=ctx, timeout=30) as r2:
                resp2 = r2.read().decode()
                log(f'Publish fallback response: {resp2[:200]}')
                return True
        except Exception as e2:
            log(f'PUBLISH FALLBACK ERROR: {e2}')
            log('INFO: Portal rebuilt locally. Run share-puppy agent manually to publish.')
            return False

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description='E2E Fashion Portal daily sync')
    parser.add_argument('--dry-run',    action='store_true', help='Print changes, no writes')
    parser.add_argument('--no-publish', action='store_true', help='Sync + rebuild, skip publish')
    parser.add_argument('--no-scrape',  action='store_true', help='Skip Jira scraping (changelog only)')
    args = parser.parse_args()

    _t_start    = time.monotonic()
    _started_at = datetime.now().strftime('%H:%M:%S %Z').strip() or datetime.now().strftime('%H:%M:%S')
    _errors: list[str] = []

    log('=' * 60)
    log(f'E2E Fashion Portal Daily Sync — {TODAY}')
    log('=' * 60)

    # Skip if already synced today (unless --force passed)
    if '--force' not in sys.argv:
        last_line = ''
        try:
            lines = LOG_FILE.read_text().splitlines()
            last_sync = next(
                (l for l in reversed(lines) if 'Sync complete' in l), ''
            )
            if TODAY in last_sync:
                log(f'Already synced today ({TODAY}) — skipping. Use --force to override.')
                return
        except FileNotFoundError:
            pass

    # 1. Load Chrome cookies
    log('Loading Chrome cookies...')
    cookies = load_chrome_cookies([
        '.walmart.com',
        'confluence.walmart.com',
        'jira.walmart.com',
        'puppy.walmart.com',
    ])
    log(f'  Loaded {len(cookies)} cookies')
    if not cookies:
        log('WARNING: No cookies — fetches will be unauthenticated (may get 403)')

    opener = make_session(cookies)

    # 2. Fetch Confluence LLTT Dashboard
    log(f'Fetching Confluence dashboard: {CONFLUENCE_DASHBOARD_URL}')
    dash_html = fetch(opener, CONFLUENCE_DASHBOARD_URL)
    opif_ids  = extract_opif_ids(dash_html)
    log(f'  Found {len(opif_ids)} OPIF IDs on dashboard: {opif_ids[:10]}...')

    if not opif_ids:
        log('ERROR: No OPIF IDs found — Confluence may require re-authentication')
        log('  Open Chrome, visit confluence.walmart.com, then re-run this script')
        sys.exit(1)

    # 3. Load current portal card state + changelog
    current_cards = load_current_cards()
    changelog     = load_changelog()
    log(f'  Portal currently has {len(current_cards)} tracked cards')

    # 4. Determine which OPIFs are known vs. new
    # Map OPIF IDs to card IDs via techIntegration field references
    known_opifs: set[str] = set()
    for f in sorted(BASE.glob('data-*.js')):
        if f.name == 'data-changelog.js':
            continue
        txt = f.read_text()
        for opif in re.findall(r'OPIF-\d+', txt):
            known_opifs.add(opif)
    new_opifs = [oid for oid in opif_ids if oid not in known_opifs]
    log(f'  Known OPIFs: {len(known_opifs)} | New OPIFs: {len(new_opifs)}')
    if new_opifs:
        log(f'  New OPIFs to evaluate: {new_opifs}')

    if args.no_scrape:
        log('--no-scrape: skipping Jira scraping')
    else:
        # 5. Scrape known OPIFs and detect changes
        total_changes = 0
        for card_id, card in current_cards.items():
            # Find which OPIF IDs belong to this card
            src = (BASE / card['source']).read_text()
            m   = re.search(
                rf"id:\s*'{re.escape(card_id)}'.*?techIntegration:", src, re.S)
            if not m:
                continue
            opif_m = re.search(r'OPIF-(\d+)', src[m.start():m.start()+2000])
            if not opif_m:
                continue
            primary_opif = f'OPIF-{opif_m.group(1)}'
            if primary_opif not in opif_ids:
                continue  # Only sync OPIFs on the dashboard

            log(f'  Scraping {primary_opif} for card "{card_id}"...')
            scraped = scrape_opif(opener, primary_opif)
            if not scraped:
                continue

            new_entries = detect_changes(card_id, card, scraped, changelog)
            if new_entries:
                total_changes += len(new_entries)
                for e in new_entries:
                    log(f'    CHANGE [{card_id}] {e["field"]}: '
                        f'"{e["fromLabel"]}" → "{e["toLabel"]}"')

                if not args.dry_run:
                    # Apply updates to data file
                    updates = {}
                    for e in new_entries:
                        if e['field'] == 'status':
                            updates['status'] = scraped['status']
                            if scraped.get('statusLabel'):
                                updates['statusLabel'] = scraped['statusLabel']
                        elif e['field'] == 'targetDate':
                            updates['targetDate'] = scraped['targetDate']
                            if scraped.get('quarter'):
                                updates['quarter'] = scraped['quarter']
                    patch_card_in_file(card_id, card['source'], updates)

                    # Append to changelog
                    existing = changelog.get(card_id, [])
                    # Deduplicate: don't add same field+date twice
                    existing_keys = {(e['date'], e['field']) for e in existing}
                    for e in new_entries:
                        if (e['date'], e['field']) not in existing_keys:
                            existing.append(e)
                    changelog[card_id] = existing

        log(f'Total changes detected: {total_changes}')

        # 6. Handle new OPIFs
        if new_opifs:
            log(f'New OPIFs found — scraping for enrichment...')
            for opif_id in new_opifs[:10]:  # cap at 10 new per run
                log(f'  Scraping new OPIF {opif_id}...')
                scraped = scrape_opif(opener, opif_id)
                if scraped.get('title'):
                    log(f'    Title: {scraped["title"]}')
                    log(f'    Status: {scraped.get("rawStatus", "unknown")}')
                    log(f'    Date: {scraped.get("targetDate", "TBD")}')
                    if not args.dry_run:
                        _append_new_opif(scraped)

    # 7. Write changelog
    if not args.dry_run:
        write_changelog(changelog)
        log('Changelog written.')

    # 8. Rebuild
    if not args.dry_run:
        if not rebuild_portal():
            sys.exit(1)

        git_commit(
            f'sync({TODAY}): auto-sync from OPIF/Confluence — '
            f'{sum(len(v) for v in changelog.values())} total tracked changes'
        )

    # 9. Publish
    _published = False
    if not args.dry_run and not args.no_publish:
        _published = publish(cookies)
        if _published:
            log(f'Published: https://puppy.walmart.com/sharing/{PORTAL_OWNER}/{PORTAL_SLUG}')
        else:
            log('Publish via API failed — invoke share-puppy agent manually')
            _errors.append('Publish to puppy.walmart.com failed — run share-puppy manually')

    # 10. Teams notification
    _duration_s    = time.monotonic() - _t_start
    _cards_scanned = len(current_cards)

    # Flatten changelog into a list of {card, field, from_, to} for the message
    _changes_flat = [
        {'card': card_id, 'field': e['field'], 'from_': e.get('from', '—'), 'to': e.get('to', '—')}
        for card_id, entries in changelog.items()
        for e in entries
        if e.get('date') == TODAY
    ]

    _summary = {
        'date':          TODAY,
        'started_at':    _started_at,
        'duration_s':    _duration_s,
        'cards_scanned': _cards_scanned,
        'cards_updated': len([k for k, v in changelog.items() if any(e.get('date') == TODAY for e in v)]),
        'changes':       _changes_flat,
        'errors':        _errors,
        'published':     _published,
    }

    if _TEAMS_AVAILABLE and not args.dry_run:
        notify_sync_complete(_summary)
    elif args.dry_run:
        log('DRY RUN: skipping Teams notification')

    log('Sync complete.')


def _append_new_opif(scraped: dict) -> None:
    """
    Stub: append a new OPIF as a card to data-buying.js (fallback workstream).
    The card will appear in the portal with status Roadmap and TBD owners until
    a human confirms the correct workstream + enrichment.
    """
    opif_id = scraped['opifId']
    title = scraped.get('title', scraped['opifId'])
    status = scraped.get('status', 'roadmap')
    status_label = scraped.get('statusLabel', 'Roadmap — Newly Identified')
    quarter = scraped.get('quarter', 'Future')
    target_date = scraped.get('targetDate', 'TBD')
    url = scraped['url']
    
    new_block = f"""
  {{
    id: '{opif_id.lower()}', title: '{title}', icon: '\U0001F4CB',
    status: '{status}',
    statusLabel: '{status_label}',
    quarter: '{quarter}',
    targetDate: '{target_date}',
    tag: 'New — Needs Review',
    description: 'Newly identified OPIF from LLTT Dashboard. Awaiting full enrichment.',
    businessBenefit: 'TBD',
    techIntegration: 'Primary OPIF: {opif_id}',
    successMetrics: 'TBD',
    owners: TBD_OWNERS(),
    resources: res('{url}'),
    workstreams: ['buying'],  // TODO: confirm correct workstream
  }},"""
    path = BASE / 'data-buying.js'
    txt  = path.read_text()
    # Insert before the closing ]; of the CARDS array
    txt  = txt.replace('\n];', new_block + '\n];', 1)
    path.write_text(txt)
    log(f'    Appended new card for {scraped["opifId"]} to data-buying.js (needs workstream review)')


if __name__ == '__main__':
    main()