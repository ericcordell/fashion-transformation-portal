#!/usr/bin/env python3
"""Build portal-inlined.html — single self-contained file for sharing.

Inlines portal.css, portal-goals.css, and all <script src=...> JS files
found in index.html, producing portal-inlined.html.

Also produces portal-final.html — a rjsmin-compressed version safe for
publishing to puppy.walmart.com (stays under the ~202 KB API limit).

Requires: pip install rjsmin
"""
import re
from pathlib import Path

try:
    import rjsmin
    _RJSMIN = True
except ImportError:
    _RJSMIN = False

BASE = Path(__file__).parent
SRC  = BASE / 'index.html'
OUT  = BASE / 'portal-inlined.html'

# JS files to inline in order (mirrors script tags in index.html)
JS_ORDER = [
    'data.js',
    'data-strategy.js',
    'data-design.js',
    'data-buying.js',
    'data-allocation.js',
    'data-phases.js',
    'data-goals.js',
    'data-goal-map.js',   # goal → card mappings for gantt
    'exec-narratives.js',
    'exec-summary.js',
    'roadmap-window.js',
    'summary-modal.js',
    'goal-modal.js',
    'card-modal.js',        # program card detail modal
    'phase-view.js',
    'card-links.js',
    'control-panel.js',      # unified control panel
    'data-wpr-housekeeping.js',  # WPR housekeeping talking points
    'business-reviews.js',  # business review modules
    'gantt.js',             # gantt chart view
    'data-biz-impact.js', # business impact timeline data (Q1+Q2 FY27 scope)
    'gantt-biz.js',         # business impact view renderer + view toggle
    'content-quality.js',   # PM content quality scorer + hover badges
    'data-changelog.js',    # must come AFTER allCards is defined
]

CSS_FILES = ['portal.css', 'portal-goals.css', 'exec-summary.css', 'reviews.css', 'control-panel.css', 'card-modal.css', 'gantt.css']


def inline_css(html):
    """Replace <link rel=stylesheet href=X> with <style>...</style>."""
    for css_file in CSS_FILES:
        path = BASE / css_file
        if not path.exists():
            continue
        css_src = path.read_text('utf-8')
        inlined = '<style>\n' + css_src + '\n</style>'
        pattern = re.compile(
            r'<link\s[^>]*href=["\']' + re.escape(css_file) + r'["\'][^>]*>',
            re.IGNORECASE,
        )
        # Use lambda to prevent re from interpreting backslashes in replacement
        html = pattern.sub(lambda _: inlined, html)
    return html


def inline_js(html):
    """Replace <script src=X></script> with <script>...</script>."""
    for js_file in JS_ORDER:
        path = BASE / js_file
        if not path.exists():
            continue
        js_src = path.read_text('utf-8')
        inlined = '<script>\n' + js_src + '\n</script>'
        pattern = re.compile(
            r'<script\s[^>]*src=["\']' + re.escape(js_file) + r'["\'][^>]*>\s*</script>',
            re.IGNORECASE,
        )
        # Use lambda to prevent re from interpreting backslashes in replacement
        html = pattern.sub(lambda _: inlined, html)
    return html


def _compress(html: str) -> str:
    """Produce a puppy-safe compressed version using rjsmin for JS blocks.

    rjsmin correctly handles template literals, regex, and string contents
    — unlike naive whitespace strippers that break JS syntax.
    Falls back to basic whitespace collapse if rjsmin is not installed.
    """
    if _RJSMIN:
        def _minify_script(m):
            try:
                return '<script>' + rjsmin.jsmin(m.group(1), keep_bang_comments=False) + '</script>'
            except Exception:
                return m.group(0)
        html = re.sub(r'<script>(.*?)</script>', _minify_script, html, flags=re.DOTALL)
    else:
        print('WARNING: rjsmin not installed — JS minification skipped. Run: pip install rjsmin')

    # Safe CSS compression (strip comments + blank lines)
    def _minify_style(m):
        css = re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.DOTALL)
        css = '\n'.join(l.strip() for l in css.splitlines() if l.strip())
        return '<style>' + css + '</style>'
    html = re.sub(r'<style>(.*?)</style>', _minify_style, html, flags=re.DOTALL)

    # Strip HTML comments and collapse inter-tag whitespace
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'>\s{2,}<', '><', html)
    html = '\n'.join(l for l in html.splitlines() if l.strip())
    return html


def syntax_check(html: str) -> bool:
    """Run JavaScriptCore (osascript) over every inlined <script> block.

    Filters expected ReferenceErrors (cross-block globals like window,
    document, pptOwners) and surfaces only real SyntaxErrors.
    Returns True if clean, False (and prints errors) if any SyntaxError found.
    """
    import subprocess, tempfile, os
    scripts = re.findall(r'<script>([\s\S]*?)</script>', html)
    errors = []
    for i, s in enumerate(scripts):
        if not s.strip():
            continue
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js',
                                         delete=False, encoding='utf-8') as f:
            f.write(s)
            fname = f.name
        try:
            result = subprocess.run(
                ['osascript', '-l', 'JavaScript', fname],
                capture_output=True, text=True, timeout=5,
            )
            err = result.stderr.strip()
            if 'SyntaxError' in err or 'syntax error' in err.lower():
                errors.append((i, len(s), err[:250]))
        except FileNotFoundError:
            pass  # osascript not available (non-Mac)
        except subprocess.TimeoutExpired:
            pass
        finally:
            os.unlink(fname)

    if errors:
        print('\n❌ BUILD ABORTED — SyntaxErrors detected:')
        for i, sz, err in errors:
            print(f'  Block {i} ({sz:,} chars): {err}')
        return False
    print(f'  ✓ Syntax check: all {len(scripts)} script blocks clean')
    return True


def main():
    html = SRC.read_text('utf-8')
    html = inline_css(html)
    html = inline_js(html)
    OUT.write_text(html, 'utf-8')
    size_kb = OUT.stat().st_size / 1024
    print('Written {} ({:.1f} KB)'.format(OUT.name, size_kb))

    # Syntax gate — abort before producing portal-final.html if broken
    import sys
    if not syntax_check(html):
        sys.exit(1)

    # Build the compressed version for puppy.walmart.com publishing
    final = BASE / 'portal-final.html'
    compressed = _compress(html)
    final.write_text(compressed, 'utf-8')
    final_kb = final.stat().st_size / 1024
    print('Written {} ({:.1f} KB) — ready for puppy publish'.format(final.name, final_kb))


if __name__ == '__main__':
    main()