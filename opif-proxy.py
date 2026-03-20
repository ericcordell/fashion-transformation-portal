#!/usr/bin/env python3
"""
opif-proxy.py — Local OPIF refresh proxy for E2E Fashion Portal

Runs on http://localhost:7465 — proxies authenticated Jira requests
from the portal browser (puppy.walmart.com) using Chrome SSO cookies.

Endpoints:
  GET /health              → {"status": "ok", "version": "1.0"}
  GET /opif/{OPIF-ID}      → parsed OPIF fields as JSON
  GET /opif/{OPIF-ID}/raw  → raw Jira issue JSON (REST API)

Managed by LaunchAgent: com.walmart.fashion-portal-proxy.plist
Log: ~/Downloads/fashion-portal/proxy.log
"""
from __future__ import annotations
import http.server
import json
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
from datetime import datetime
from pathlib import Path
from urllib import request as urlreq, error as urlerr
from urllib.parse import urlparse

PORT      = 7465
JIRA_BASE = 'https://jira.walmart.com'
LOG_FILE  = Path(__file__).parent / 'proxy.log'
COOKIE_REFRESH_INTERVAL = 3600  # re-read Chrome cookies every hour

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg: str) -> None:
    ts   = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with LOG_FILE.open('a') as f:
        f.write(line + '\n')

# ── Chrome cookie loader (shared with daily-sync.py) ─────────────────────────
class CookieStore:
    """Thread-safe Chrome cookie cache with periodic refresh.
    Cookies are loaded lazily on first use to avoid blocking server startup
    on macOS Keychain authorization dialogs.
    """
    def __init__(self) -> None:
        self._lock         = threading.Lock()
        self._cookies: dict[str, str] = {}
        self._last_refresh = 0.0
        # Do NOT load cookies in __init__ — let first request trigger it

    def refresh(self, force: bool = False) -> None:
        import time
        now = time.monotonic()
        with self._lock:
            if not force and now - self._last_refresh < COOKIE_REFRESH_INTERVAL and self._cookies:
                return
        log('Refreshing Chrome cookies...')
        try:
            cookies = _load_chrome_cookies(['.walmart.com', 'jira.walmart.com'])
        except Exception as e:
            log(f'  Cookie load error: {e}')
            cookies = {}
        with self._lock:
            self._cookies      = cookies
            self._last_refresh = time.monotonic()
        log(f'  Loaded {len(cookies)} cookies')

    @property
    def header(self) -> str:
        with self._lock:
            return '; '.join(f'{k}={v}' for k, v in self._cookies.items())


def _get_chrome_key() -> bytes:
    res = subprocess.run(
        ['security', 'find-generic-password', '-w', '-s', 'Chrome Safe Storage', '-a', 'Chrome'],
        capture_output=True, text=True,
    )
    if res.returncode != 0:
        raise RuntimeError('Keychain read failed')
    pw = res.stdout.strip()
    import hashlib
    return hashlib.pbkdf2_hmac('sha1', pw.encode(), b'saltysalt', 1003, dklen=16)


def _load_chrome_cookies(domains: list[str]) -> dict[str, str]:
    db = Path.home() / 'Library/Application Support/Google/Chrome/Default/Cookies'
    if not db.exists():
        return {}
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        tmp_path = Path(tmp.name)
    shutil.copy2(db, tmp_path)
    try:
        key = _get_chrome_key()
    except Exception:
        key = b''
    cookies: dict[str, str] = {}
    try:
        con = sqlite3.connect(str(tmp_path))
        phs = ','.join('?' for _ in domains)
        rows = con.execute(
            f'SELECT name, encrypted_value FROM cookies WHERE host_key IN ({phs})',
            domains,
        ).fetchall()
        con.close()
        for name, enc in rows:
            val = _decrypt(enc, key) if key else ''
            if val:
                cookies[name] = val
    except Exception as e:
        log(f'Cookie read error: {e}')
    finally:
        tmp_path.unlink(missing_ok=True)
    return cookies


def _decrypt(enc: bytes, key: bytes) -> str:
    try:
        from Crypto.Cipher import AES  # type: ignore
    except ImportError:
        return ''
    if enc[:3] != b'v10':
        return enc.decode('utf-8', errors='replace')
    cipher = AES.new(key, AES.MODE_CBC, IV=b' ' * 16)
    dec    = cipher.decrypt(enc[3:])
    return dec[:-dec[-1]].decode('utf-8', errors='replace')


# ── OPIF Jira scraper ─────────────────────────────────────────────────────────
STATUS_MAP = {
    'in progress'       : ('yellow',   'Yellow — Work in Progress'),
    'work in progress'  : ('yellow',   'Yellow — Work in Progress'),
    'at risk'           : ('red',      'Red — At Risk'),
    'on track'          : ('green',    'Green — In Progress'),
    'done'              : ('complete', 'Complete ✓'),
    'closed'            : ('complete', 'Complete ✓'),
    'completed'         : ('complete', 'Complete ✓'),
    'roadmap'           : ('roadmap',  'Roadmap'),
    'planned'           : ('roadmap',  'Roadmap'),
    'backlog'           : ('roadmap',  'Roadmap'),
    'initial requirements': ('roadmap','Roadmap — Initial Requirements'),
    'green'             : ('green',    'Green — In Progress'),
    'yellow'            : ('yellow',   'Yellow — Trending Green'),
    'red'               : ('red',      'Red — At Risk'),
}


def _fetch_jira(cookie_store: CookieStore, url: str) -> str:
    cookie_store.refresh()
    req = urlreq.Request(url, headers={
        'Cookie'    : cookie_store.header,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) '
                      'Chrome/122.0.0.0 Safari/537.36',
        'Accept'    : 'text/html,application/xhtml+xml',
    })
    try:
        with urlreq.urlopen(req, timeout=15) as r:
            return r.read().decode('utf-8', errors='replace')
    except urlerr.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code} from Jira') from e
    except Exception as e:
        raise RuntimeError(str(e)) from e


def scrape_opif(cookie_store: CookieStore, opif_id: str) -> dict:
    opif_id = opif_id.upper()
    if not re.fullmatch(r'OPIF-\d{3,7}', opif_id):
        raise ValueError(f'Invalid OPIF ID: {opif_id}')

    url  = f'{JIRA_BASE}/browse/{opif_id}'
    html = _fetch_jira(cookie_store, url)
    result: dict = {'opifId': opif_id, 'url': url, 'fetchedAt': datetime.utcnow().isoformat() + 'Z'}

    # Title
    m = re.search(r'<title[^>]*>([^<]+)</title>', html)
    if m:
        result['title'] = re.sub(r'\s*\[OPIF-\d+\].*$', '', m.group(1)).strip()

    # Status lozenge
    for pat in [
        r'id="opsbar-transitions_more"[^>]*>\s*<span[^>]*>([^<]+)</span>',
        r'class="[^"]*jira-issue-status-lozenge[^"]*"[^>]*>\s*([^<\s][^<]+?)\s*<',
        r'id="status-val"[^>]*>.*?<span[^>]*>([^<]+)</span>',
    ]:
        sm = re.search(pat, html, re.S)
        if sm:
            raw = sm.group(1).strip().lower()
            result['rawStatus'] = raw
            key  = next((k for k in STATUS_MAP if k in raw), None)
            code, label = STATUS_MAP.get(raw, STATUS_MAP.get(key, ('', '')))
            if code:
                result['status']      = code
                result['statusLabel'] = label
            break

    # Due / target date
    dm = re.search(r'id="duedate-val"[^>]*>\s*<time[^>]+datetime="([^"]+)"', html)
    if dm:
        try:
            d = datetime.strptime(dm.group(1)[:10], '%Y-%m-%d')
            result['targetDate'] = d.strftime('%B %-d, %Y')
            result['quarter']    = f'Q{(d.month - 1) // 3 + 1}'
        except ValueError:
            pass

    # Priority
    pm = re.search(r'id="priority-val"[^>]*>.*?<img[^>]+alt="([^"]+)"', html, re.S)
    if pm:
        result['priority'] = pm.group(1).strip()

    # Reporter / assignee
    am = re.search(r'id="assignee-val"[^>]*>.*?<a[^>]+>([^<]+)</a>', html, re.S)
    if am:
        result['assignee'] = am.group(1).strip()

    # Detect if redirected to login (not authenticated)
    if 'login.jsp' in html or 'Log In' in html[:500]:
        result['authWarning'] = True
        log(f'  WARNING: Jira may have redirected to login for {opif_id}')

    return result


# ── HTTP Handler ──────────────────────────────────────────────────────────────
class ProxyHandler(http.server.BaseHTTPRequestHandler):
    cookie_store: CookieStore  # set on class before serving

    # ---- CORS headers on every response ----
    def _cors(self) -> None:
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path.rstrip('/')
        if path == '/health':
            self._json({'status': 'ok', 'port': PORT, 'version': '1.0'})
        elif m := re.fullmatch(r'/opif/(OPIF-\d+)', path, re.I):
            self._handle_opif(m.group(1).upper())
        else:
            self._json({'error': 'Unknown endpoint'}, 404)

    def _handle_opif(self, opif_id: str) -> None:
        log(f'Refresh request: {opif_id}')
        try:
            data = scrape_opif(self.cookie_store, opif_id)
            self._json(data)
        except ValueError as e:
            self._json({'error': str(e)}, 400)
        except RuntimeError as e:
            err = str(e)
            if '401' in err or '403' in err:
                self._json({
                    'error'   : 'auth_required',
                    'message' : 'Open jira.walmart.com in Chrome to refresh your session, then try again.',
                }, 401)
            else:
                self._json({'error': err}, 502)

    def _json(self, data: dict, code: int = 200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:  # suppress default logging
        pass


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    log(f'OPIF Proxy starting on http://localhost:{PORT}')
    store = CookieStore()
    ProxyHandler.cookie_store = store
    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), ProxyHandler)
    log(f'Listening. Endpoints: /health  /opif/OPIF-XXXXXX')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log('Shutting down.')


if __name__ == '__main__':
    main()