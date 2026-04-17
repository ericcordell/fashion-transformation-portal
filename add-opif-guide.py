#!/usr/bin/env python3
"""
add-opif-guide.py
Injects the OPIF Field Mapping Guide into the portal HTML
"""
from pathlib import Path

def inject_guide():
    # Read portal HTML
    portal_file = Path('portal-final.html')
    if not portal_file.exists():
        print("ERROR: portal-final.html not found")
        return False
    
    portal_html = portal_file.read_text()
    
    # Read guide CSS
    css_file = Path('opif-guide-styles.css')
    guide_css = css_file.read_text() if css_file.exists() else ''
    
    # Read guide HTML
    html_file = Path('opif-guide-modal.html')
    guide_html = html_file.read_text() if html_file.exists() else ''
    
    # Check if already injected
    if 'opif-guide-styles' in portal_html:
        print("⚠️  Guide already injected in portal")
        return False
    
    # Inject CSS before </style>
    css_injection = f"""

/* ========== OPIF Field Mapping Guide Styles ========== */
{guide_css}
/* ====================================================== */
"""
    
    portal_html = portal_html.replace('</style>', css_injection + '</style>')
    
    # Inject HTML before </body>
    html_injection = f"""

<!-- ========== OPIF Field Mapping Guide ========== -->
{guide_html}
<!-- ============================================== -->
"""
    
    portal_html = portal_html.replace('</body>', html_injection + '</body>')
    
    # Inject the guide button into the header (right side)
    # Use regex so this survives date/text changes in the header.
    import re
    header_button = ('<button class="guide-button" onclick="openGuideModal()" style="margin-left:16px;">'
                    '<span class="guide-button-icon">ℹ️</span>'
                    '<span>Help &amp; How-To</span>'
                    '</button>')

    # Match the subtitle div inside <header> — works regardless of date/text content
    header_pattern = re.compile(
        r'(<div style="color:#a8c4ff"[^>]*class="text-xs"[^>]*>'
        r'|<div class="text-xs"[^>]*style="color:#a8c4ff"[^>]*>)'
        r'([^<]*</div>)',
    )
    new_html, n_subs = header_pattern.subn(
        lambda m: '<div class="flex items-center gap-3">' + m.group(0) + header_button + '</div>',
        portal_html,
        count=1,
    )
    if n_subs == 0:
        print('  ⚠️  WARNING: header button injection failed — subtitle div not found.')
        print('             Guide modal is present but no button in header.')
    else:
        portal_html = new_html
        print('  ✓ Header button injected')
    
    # Write back
    portal_file.write_text(portal_html)
    
    print("✅ Successfully injected OPIF Field Mapping Guide")
    print(f"   CSS: {len(guide_css)} characters")
    print(f"   HTML: {len(guide_html)} characters")
    print(f"   Updated: {portal_file}")
    
    return True

if __name__ == '__main__':
    inject_guide()
