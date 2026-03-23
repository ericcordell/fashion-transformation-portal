#!/usr/bin/env python3
"""Publish portal-minified.html to puppy.walmart.com via API."""
from pathlib import Path
import urllib.request
import json
import re
import sys

# Read token from config
cfg = Path.home() / '.code_puppy' / 'puppy.cfg'
if not cfg.exists():
    print('❌ Config file not found:', cfg)
    sys.exit(1)

token_match = re.search(r'puppy_token\s*=\s*(\S+)', cfg.read_text())
if not token_match:
    print('❌ Could not find puppy_token in config')
    sys.exit(1)

token = token_match.group(1)
html = Path(__file__).parent.joinpath('portal-minified.html').read_text('utf-8')

print(f'📦 Uploading {len(html)} characters ({len(html)/1024:.1f} KB)...')

url = 'https://puppy.walmart.com/api/sharing/e0c0lzr/e2e-fashion-portal'
payload = json.dumps({'content': html}).encode('utf-8')

print(f'📦 Payload size: {len(payload)/1024:.1f} KB')

req = urllib.request.Request(
    url,
    data=payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    },
    method='PUT'
)

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode())
        print(f'✅ SUCCESS! Version {result.get("version", "?")} uploaded')
        print(f'🔗 https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f'❌ HTTP {e.code}:')
    print(body[:1000])
    sys.exit(1)
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
