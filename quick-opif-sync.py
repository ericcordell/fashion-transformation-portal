#!/usr/bin/env python3
"""
quick-opif-sync.py - Quick OPIF update bypassing Confluence
Directly scrapes known OPIFs from Jira using Chrome cookies
"""
import sys
import re
import subprocess
import shutil
import tempfile
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any
import http.cookiejar as cookielib
import urllib.request as urlreq

JIRA_BASE = 'https://jira.walmart.com'
LOG_FILE = Path(__file__).parent / 'sync.log'

def log(msg: str) -> None:
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with LOG_FILE.open('a') as f:
        f.write(line + '\n')

def _get_chrome_key() -> bytes:
    result = subprocess.run(
        ['security', 'find-generic-password', '-w',
         '-s', 'Chrome Safe Storage', '-a', 'Chrome'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError('Cannot read Chrome key from Keychain')
    pw = result.stdout.strip()
    import hashlib
    key = hashlib.pbkdf2_hmac('sha1', pw.encode(), b'saltysalt', 1003, dklen=16)
    return key

def _decrypt_chrome_cookie(enc: bytes, key: bytes) -> str:
    try:
        from Crypto.Cipher import AES
    except ImportError:
        return ''
    if enc[:3] != b'v10':
        return enc.decode('utf-8', errors='replace')
    iv = b' ' * 16
    cipher = AES.new(key, AES.MODE_CBC, IV=iv)
    decrypted = cipher.decrypt(enc[3:])
    pad = decrypted[-1]
    return decrypted[:-pad].decode('utf-8', errors='replace')

def load_chrome_cookies(domains: list[str]) -> dict[str, str]:
    cookie_db = Path.home() / 'Library/Application Support/Google/Chrome/Default/Cookies'
    if not cookie_db.exists():
        log('WARNING: Chrome cookie database not found')
        return {}
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        tmp_path = Path(tmp.name)
    shutil.copy2(cookie_db, tmp_path)
    try:
        key = _get_chrome_key()
    except Exception as e:
        log(f'WARNING: Could not get Chrome key: {e}')
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
    cookie_jar = cookielib.CookieJar()
    opener = urlreq.build_opener(urlreq.HTTPCookieProcessor(cookie_jar))
    safe_cookies = {k: v for k, v in cookies.items() if all(ord(c) < 128 for c in v)}
    opener.addheaders = [
        ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/122.0.0.0 Safari/537.36'),
        ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
        ('Cookie', '; '.join(f'{k}={v}' for k, v in safe_cookies.items())),
    ]
    return opener

def fetch(opener: urlreq.OpenerDirector, url: str, timeout: int = 20) -> str:
    try:
        with opener.open(url, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        log(f'FETCH ERROR {url}: {e}')
        return ''

STATUS_MAP = {
    'in progress': ('yellow', 'Yellow — Work in Progress'),
    'work in progress': ('yellow', 'Yellow — Work in Progress'),
    'at risk': ('red', 'Red — At Risk'),
    'on track': ('green', 'Green — In Progress'),
    'green': ('green', 'Green — In Progress'),
    'yellow': ('yellow', 'Yellow — Trending Green'),
    'red': ('red', 'Red — At Risk'),
    'done': ('complete', 'Complete'),
    'completed': ('complete', 'Complete'),
    'closed': ('complete', 'Complete'),
    'roadmap': ('roadmap', 'Roadmap'),
    'planned': ('roadmap', 'Roadmap'),
    'backlog': ('roadmap', 'Roadmap'),
}

def scrape_opif(opener: urlreq.OpenerDirector, opif_id: str) -> dict[str, Any]:
    url = f'{JIRA_BASE}/browse/{opif_id}'
    html = fetch(opener, url)
    if not html:
        return {}
    result: dict[str, Any] = {'opifId': opif_id, 'url': url}

    # Title
    title_m = re.search(r'<title[^>]*>([^<]+)</title>', html)
    if title_m:
        raw = title_m.group(1).strip()
        result['title'] = re.sub(r'\s*\[OPIF-\d+\].*$', '', raw).strip()

    # Status
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
        result['status'] = sk
        result['statusLabel'] = sl

    # Due date
    date_m = re.search(r'id="duedate-val"[^>]*>\s*<time[^>]+datetime="([^"]+)"', html)
    if date_m:
        try:
            d = datetime.strptime(date_m.group(1)[:10], '%Y-%m-%d')
            result['targetDate'] = d.strftime('%B %-d, %Y')
            result['quarter'] = f'Q{(d.month - 1) // 3 + 1}'
        except:
            pass

    return result

# Known OPIFs from data files
KNOWN_OPIFS = [
    'OPIF-325188', 'OPIF-325203', 'OPIF-325206', 'OPIF-325208',
    'OPIF-325216', 'OPIF-325217', 'OPIF-325218', 'OPIF-325221',
    'OPIF-325373', 'OPIF-325374', 'OPIF-325565', 'OPIF-325568',
    'OPIF-325569', 'OPIF-325598', 'OPIF-325599', 'OPIF-325602',
    'OPIF-336019', 'OPIF-337970', 'OPIF-344926', 'OPIF-347498',
    'OPIF-347500'
]

def main():
    log('Quick OPIF Sync - Bypassing Confluence, direct Jira scrape')
    log(f'Updating {len(KNOWN_OPIFS)} known OPIFs...')
    
    # Load Chrome cookies
    log('Loading Chrome cookies...')
    cookies = load_chrome_cookies(['.walmart.com', 'jira.walmart.com'])
    log(f'  Loaded {len(cookies)} cookies')
    
    if not cookies:
        log('ERROR: No cookies found - please open jira.walmart.com in Chrome first')
        return 1
    
    # Create session
    opener = make_session(cookies)
    
    # Scrape each OPIF
    results = []
    for i, opif_id in enumerate(KNOWN_OPIFS, 1):
        log(f'[{i}/{len(KNOWN_OPIFS)}] Scraping {opif_id}...')
        data = scrape_opif(opener, opif_id)
        if data:
            results.append(data)
            status = data.get('statusLabel', 'Unknown')
            target = data.get('targetDate', 'TBD')
            log(f'  ✅ {opif_id}: {status} | Target: {target}')
        else:
            log(f'  ❌ Failed to scrape {opif_id}')
    
    log(f'\nSuccessfully scraped {len(results)}/{len(KNOWN_OPIFS)} OPIFs')
    
    # Print summary
    print('\n' + '='*60)
    print('OPIF SYNC SUMMARY')
    print('='*60)
    for data in results:
        print(f"\n{data['opifId']}:")
        print(f"  Status: {data.get('statusLabel', 'Unknown')}")
        print(f"  Target: {data.get('targetDate', 'TBD')}")
        print(f"  Quarter: {data.get('quarter', 'TBD')}")
    
    print('\n' + '='*60)
    print(f'Total: {len(results)} OPIFs updated')
    print('='*60)
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
