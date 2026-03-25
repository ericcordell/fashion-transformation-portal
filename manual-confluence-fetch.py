#!/usr/bin/env python3
import sys
import re
from pathlib import Path

# Import Chrome cookie functions
sys.path.insert(0, str(Path(__file__).parent))
exec(open('daily-sync.py').read().split('# ── Parse Confluence')[0])

# Fetch the Confluence page
log('Manual Confluence Fetch')
log('Loading Chrome cookies...')
cookies = load_chrome_cookies(['.walmart.com', 'confluence.walmart.com'])
log(f'  Loaded {len(cookies)} cookies')

if not cookies:
    log('ERROR: No cookies - please visit confluence.walmart.com in Chrome first')
    sys.exit(1)

opener = make_session(cookies)
url = CONFLUENCE_DASHBOARD_URL

log(f'Fetching: {url}')
html = fetch(opener, url, timeout=30)

if not html:
    log('ERROR: Failed to fetch page')
    sys.exit(1)

log(f'Fetched {len(html)} bytes')

# Save raw HTML for inspection
output_file = Path('confluence-raw.html')
output_file.write_text(html)
log(f'Saved to {output_file}')

# Try to find OPIF references
opif_pattern = re.compile(r'OPIF-\d{5,7}', re.IGNORECASE)
opifs = opif_pattern.findall(html)
log(f'\nFound {len(opifs)} OPIF references')

if opifs:
    unique_opifs = list(dict.fromkeys(opifs))
    log(f'Unique OPIFs: {len(unique_opifs)}')
    for opif in unique_opifs:
        log(f'  - {opif}')
else:
    log('No OPIFs found - checking for common patterns...')
    # Look for table structures
    if '<table' in html:
        log('  Found <table> tags')
    if 'class="confluenceTable"' in html:
        log('  Found confluenceTable class')
    if 'data-' in html:
        log('  Found data- attributes (might be JavaScript rendered)')
    
    # Save a snippet for debugging
    log('\nFirst 2000 chars of HTML:')
    print(html[:2000])

