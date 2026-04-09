import re, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# ════════════════════════════════════════════════════════════════════
# FIX A — portal.css
# ════════════════════════════════════════════════════════════════════
css = open('portal.css').read()

# 1. Remove .inquiry-owner-row CSS
css = css.replace(
    '/* ---- Inquiry tab ---- */\n'
    '.inquiry-owner-row { display:flex; align-items:center; justify-content:space-between;\n'
    '                     padding:8px 0; border-bottom:1px solid #f3f4f6; }\n'
    '.inquiry-owner-row:last-child { border-bottom: none; }\n',
    ''
)

# 2+3. Remove the duplicate sm-overlay z-index rule and fix its stale comment
css = css.replace(
    '/* ---- Summary modal (z:96) ---- */\n#sm-overlay { z-index:96; }',
    '/* ---- Summary modal ---- */'
)

open('portal.css', 'w').write(css)
print(f'portal.css ({len(css.splitlines())} lines)')
assert '.inquiry-owner-row' not in css, 'FAIL: inquiry-owner-row still present'
assert 'z-index:96' not in css,         'FAIL: z-index:96 still present'
assert 'sm-overlay    { z-index:200;' in css, 'FAIL: z-index:200 missing'
print('  ✅ inquiry CSS removed')
print('  ✅ z-index:96 duplicate removed, z-index:200 kept')

# ════════════════════════════════════════════════════════════════════
# FIX B — index.html
# ════════════════════════════════════════════════════════════════════
html = open('index.html').read()

# 1. Tab button
html = html.replace(
    "        <button class=\"tab-btn\" onclick=\"switchTab('inquiry')\" style=\"color:#7c3aed;\">&#9993;&#65039; Inquiry</button>\n",
    ""
)

# 2. Panel div
html = html.replace(
    "      <div id=\"tab-inquiry\"   class=\"tab-panel\"></div>\n",
    ""
)

# 3. Inquiry CTA block — ends at the closing of the overview template literal
OLD_CTA = (
    "\n      <!-- Inquiry CTA -->\n"
    "      <div class=\"p-3 rounded-xl flex items-center gap-3 cursor-pointer\"\n"
    "           style=\"background:#f5f3ff;border:1.5px dashed #c4b5fd;\"\n"
    "           onclick=\"switchTab('inquiry')\">\n"
    "        <span style=\"font-size:1.1rem;\">&#9993;&#65039;</span>\n"
    "        <div>\n"
    "          <p class=\"text-xs font-bold\" style=\"color:#6d28d9;margin:0;\">Have a question about this deliverable?</p>\n"
    "          <p class=\"text-xs\" style=\"color:#7c3aed;margin:2px 0 0;\">Switch to the Inquiry tab to contact the owners directly.</p>\n"
    "        </div>\n"
    "        <span style=\"margin-left:auto;font-size:0.8rem;color:#7c3aed;font-weight:700;\">&#8594;</span>\n"
    "      </div>\n"
    "\n"
    "    </div>`;"
)
NEW_CTA = "\n\n    </div>`;"
html = html.replace(OLD_CTA, NEW_CTA)

# 4. Entire inquiry tab build block (bpList … tab-inquiry.innerHTML assignment)
#    Starts at "\n  // --- inquiry tab ---\n"
#    Ends just before "\n  // --- updates tab ---"
html = re.sub(
    r'\n  // --- inquiry tab ---\n.*?(?=\n  // --- updates tab)',
    '',
    html,
    flags=re.DOTALL
)

# 5. sendInquiry function
html = re.sub(
    r'\n\nfunction sendInquiry\(cardId, workstream, tool\) \{.*?\}\n\n\n',
    '\n\n',
    html,
    flags=re.DOTALL
)

# 6. Remove 'inquiry' from switchTab names
html = html.replace(
    "const names = ['overview','status','links','inquiry','updates'];",
    "const names = ['overview','status','links','updates'];"
)

open('index.html', 'w').write(html)
print(f'\nindex.html ({len(html.splitlines())} lines)')

checks = [
    ("inquiry tab button gone",  "switchTab('inquiry')" not in html),
    ("tab-inquiry div gone",     "tab-inquiry" not in html),
    ("inquiry CTA gone",         "Switch to the Inquiry tab" not in html),
    ("inquiry tab block gone",   "// --- inquiry tab ---" not in html),
    ("sendInquiry gone",         "function sendInquiry" not in html),
    ("'inquiry' in names gone",  "'inquiry'" not in html),
    ("updates tab kept",         "// --- updates tab" in html),
    ("switchTab still present",  "function switchTab" in html),
    ("Updates btn logic kept",   "tab-btn-updates" in html),
]
all_ok = True
for label, ok in checks:
    print(f"  {'✅' if ok else '❌'} {label}")
    if not ok: all_ok = False

sys.exit(0 if all_ok else 1)
