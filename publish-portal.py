#!/usr/bin/env python3
"""publish-portal.py — Publish portal-final.html to puppy.walmart.com.

Usage:
  python3 publish-portal.py --test    # publish to TEST (runs canary first)
  python3 publish-portal.py --prod    # publish to PROD (explicit, no canary)

Canonical slugs (NEVER change these — ever):
  PROD → https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod
  TEST → https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test

How this script works:
  1. For --test: uploads a tiny canary page first to confirm the pipeline
     is working end-to-end, then immediately uploads the real portal.
     Both uploads must return HTTP 200 and consecutive version numbers.
  2. For --prod: uploads the real portal directly (canary would overwrite
     prod content, which is unacceptable).

Correct API (confirmed working):
  POST https://puppy.walmart.com/api/sharing/upload
  Authorization: Bearer {puppy_token from ~/.code_puppy/puppy.cfg}
  Body: {name, business, html_content, access_level}

DO NOT use PUT /api/sharing/{owner}/{slug} — it causes broken-pipe/401.
DO NOT use Chrome cookie auth — it does not work for this endpoint.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

BASE     = Path(__file__).parent
OWNER    = 'e0c0lzr'
BASE_URL = 'https://puppy.walmart.com'
SLUGS   = {
    'prod': 'e2e-fashion-portal-prod',
    'test': 'e2e-fashion-portal-test',
}


# ── Auth ──────────────────────────────────────────────────────────────────────

def _token() -> str:
    cfg = Path.home() / '.code_puppy' / 'puppy.cfg'
    m = re.search(r'puppy_token\s*=\s*(.+)$', cfg.read_text(), re.MULTILINE)
    if not m:
        raise RuntimeError('puppy_token not found in ~/.code_puppy/puppy.cfg')
    return m.group(1).strip()


# ── Upload ────────────────────────────────────────────────────────────────────

def _upload(html: str, slug: str, description: str = '') -> dict:
    """POST html_content to /api/sharing/upload. Returns parsed JSON response.

    Raises RuntimeError on HTTP error.
    """
    import urllib.request
    import urllib.error

    token = _token()
    url   = f'{BASE_URL}/api/sharing/upload'
    body  = json.dumps({
        'name'        : slug,
        'business'    : OWNER,
        'html_content': html,
        'description' : description,
        'access_level': 'business',
    }).encode('utf-8')

    req = urllib.request.Request(url, data=body, method='POST', headers={
        'Authorization': f'Bearer {token}',
        'Content-Type' : 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code}: {e.read().decode()[:400]}') from e


def _version(result: dict) -> int | None:
    """Extract version integer from an upload response dict."""
    v = (result.get('data') or {}).get('version') or result.get('version')
    return int(v) if v is not None else None


# ── Canary preflight ──────────────────────────────────────────────────────────

def _run_canary(slug: str) -> int:
    """Upload a tiny canary page. Returns the version number it lands on.

    If the canary upload fails, we abort before touching the real portal.
    """
    ts  = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    html = f"""<!DOCTYPE html><html><body style="font-family:sans-serif;margin:40px">
<div style="background:#0053e2;color:white;padding:24px;border-radius:12px;
            font-size:20px;font-weight:bold;text-align:center">
  \U0001f436 Canary preflight — publishing pipeline OK<br>
  <span style="font-size:14px;font-weight:normal;opacity:.85">{ts}</span>
</div>
<p style="color:#64748b;font-size:13px;margin-top:16px">
  This page confirms the upload endpoint is reachable and your token is valid.
  The real portal will overwrite this immediately.
</p>
</body></html>"""
    print('  [canary] uploading preflight probe...')
    result  = _upload(html, slug, description='canary preflight — auto-replaced')
    version = _version(result)
    if version is None:
        raise RuntimeError('Canary upload returned no version number')
    print(f'  [canary] ✅ v{version} — pipeline is alive')
    return version


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    grp = ap.add_mutually_exclusive_group(required=True)
    grp.add_argument('--prod', dest='env', action='store_const', const='prod',
                     help='Publish to PROD')
    grp.add_argument('--test', dest='env', action='store_const', const='test',
                     help='Publish to TEST (runs canary first)')
    args = ap.parse_args()

    slug        = SLUGS[args.env]
    portal_file = BASE / 'portal-final.html'
    live_url    = f'{BASE_URL}/sharing/{OWNER}/{slug}'

    if not portal_file.exists():
        print('\u274c portal-final.html not found — run build-inlined.py first.')
        sys.exit(1)

    html = portal_file.read_text('utf-8')
    print(f'\U0001f4e6 Publishing to {args.env.upper()} \u2192 {slug}')
    print(f'   File  : portal-final.html ({len(html)/1024:.0f} KB)')
    print(f'   URL   : {live_url}')
    print()

    try:
        # Step 1 (TEST only): canary preflight to verify the pipeline is alive.
        if args.env == 'test':
            canary_ver = _run_canary(slug)
            expected_next = canary_ver + 1
        else:
            expected_next = None

        # Step 2: upload the real portal.
        print(f'  Uploading {len(html.encode("utf-8"))/1024:.0f} KB...')
        result  = _upload(html, slug, description=f'E2E Fashion Portal — {datetime.now():%Y-%m-%d}')
        version = _version(result)
        url_out = result.get('url') or live_url

        if version is None:
            print('\u274c Upload returned no version number — something is wrong')
            sys.exit(1)

        print(f'  \u2705 Published! v{version}')

        # Step 3 (TEST only): confirm the version incremented from the canary.
        if expected_next is not None:
            if version == expected_next:
                print(f'  \u2705 Version check passed: canary=v{canary_ver} \u2192 real=v{version} (consecutive \u2713)')
            else:
                print(f'  \u26a0\ufe0f  Version gap: expected v{expected_next}, got v{version}')
                print('     This could mean another publish happened in between — not necessarily an error.')

        print()
        print(f'\U0001f517 {url_out}')
        print('\U0001f4a1 To see changes: hard-refresh in browser (\u2318+Shift+R on Mac / Ctrl+Shift+R on Win)')
        print('   Or open in Incognito to bypass any cached session state.')

    except RuntimeError as e:
        print(f'\u274c Publish failed: {e}')
        print()
        print('Troubleshooting:')
        print('  1. Is your puppy_token fresh? Restart Code Puppy to refresh it.')
        print('  2. Are you on Walmart VPN / Eagle WiFi?')
        print('  3. Try: python3 publish-portal.py --test again')
        sys.exit(1)


if __name__ == '__main__':
    main()