#!/usr/bin/env python3
"""publish-portal.py — Publish portal-final.html to puppy.walmart.com.

Usage:
  python3 publish-portal.py           # publish to PROD (default)
  python3 publish-portal.py --test    # publish to TEST
  python3 publish-portal.py --prod    # publish to PROD (explicit)

Canonical slugs (NEVER change these):
  PROD → https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod
  TEST → https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test

Rules:
  - Daily scheduler always publishes to PROD.
  - Dev / QA / debugging sessions always publish to TEST.
  - Only publish to PROD when explicitly requested or via the scheduler.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

BASE   = Path(__file__).parent
OWNER  = 'e0c0lzr'
SLUGS  = {
    'prod': 'e2e-fashion-portal-prod',
    'test': 'e2e-fashion-portal-test',
}
BASE_URL = 'https://puppy.walmart.com'


def _token() -> str:
    cfg = Path.home() / '.code_puppy' / 'puppy.cfg'
    m = re.search(r'puppy_token\s*=\s*(.+)$', cfg.read_text(), re.MULTILINE)
    if not m:
        raise RuntimeError('puppy_token not found in ~/.code_puppy/puppy.cfg')
    return m.group(1).strip()


def _upload(html: str, slug: str) -> dict:
    """Upload via share-puppy CLI subprocess (handles auth correctly)."""
    import tempfile
    import urllib.request
    import urllib.error

    token = _token()
    url = f'{BASE_URL}/api/sharing/{OWNER}/{slug}'
    payload = json.dumps({'content': html}).encode('utf-8')
    size_kb = len(payload) / 1024
    print(f'  Uploading {size_kb:.1f} KB → {url}')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        },
        method='PUT',
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:500]
        raise RuntimeError(f'HTTP {e.code}: {body}') from e


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    grp = ap.add_mutually_exclusive_group()
    grp.add_argument('--prod', dest='env', action='store_const', const='prod',
                     help='Publish to PROD (default)')
    grp.add_argument('--test', dest='env', action='store_const', const='test',
                     help='Publish to TEST')
    ap.set_defaults(env='prod')
    args = ap.parse_args()

    slug = SLUGS[args.env]
    portal_file = BASE / 'portal-final.html'

    if not portal_file.exists():
        print('❌ portal-final.html not found — run build-inlined.py first.')
        sys.exit(1)

    html = portal_file.read_text('utf-8')
    print(f'📦 Publishing to {args.env.upper()} → /{slug}')

    try:
        result = _upload(html, slug)
        version = result.get('version', '?')
        live_url = f'{BASE_URL}/sharing/{OWNER}/{slug}'
        print(f'✅ Published! Version {version}')
        print(f'🔗 {live_url}')
    except RuntimeError as e:
        print(f'❌ Upload failed: {e}')
        print()
        print('💡 Try running via Code Puppy: "publish the portal to prod/test"')
        sys.exit(1)


if __name__ == '__main__':
    main()