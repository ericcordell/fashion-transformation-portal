#!/usr/bin/env python3
"""Build portal-inlined.html — single self-contained file for sharing.

Inlines portal.css, portal-goals.css, and all <script src=...> JS files
found in index.html, producing portal-inlined.html.
"""
import re
from pathlib import Path

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
    'data-goals.js',
    'data-phases.js',
    'card-links.js',
    'goal-modal.js',
    'exec-narratives.js',
    'exec-summary.js',
    'roadmap-window.js',
    'summary-modal.js',
    'phase-view.js',
    'data-changelog.js',  # must come AFTER allCards is defined
]

CSS_FILES = ['portal.css', 'portal-goals.css', 'exec-summary.css']


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


def main():
    html = SRC.read_text('utf-8')
    html = inline_css(html)
    html = inline_js(html)
    OUT.write_text(html, 'utf-8')
    size_kb = OUT.stat().st_size / 1024
    print('Written {} ({:.1f} KB)'.format(OUT.name, size_kb))


if __name__ == '__main__':
    main()