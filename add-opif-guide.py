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
    header_button = '''<button class="guide-button" onclick="openGuideModal()" style="margin-left: 16px;">
  <span class="guide-button-icon">ℹ️</span>
  <span>Help &amp; How-To</span>
</button>'''
    
    # Find the header closing div and inject button before it
    # The header has: ... March 2026 &bull; Confidential</div>\n</header>
    portal_html = portal_html.replace(
        '<div style="color:#a8c4ff" class="text-xs">March 2026 &bull; Confidential</div>',
        '<div class="flex items-center gap-3"><div style="color:#a8c4ff" class="text-xs">March 2026 &bull; Confidential</div>' + header_button + '</div>'
    )
    
    # Write back
    portal_file.write_text(portal_html)
    
    print("✅ Successfully injected OPIF Field Mapping Guide")
    print(f"   CSS: {len(guide_css)} characters")
    print(f"   HTML: {len(guide_html)} characters")
    print(f"   Updated: {portal_file}")
    
    return True

if __name__ == '__main__':
    inject_guide()
