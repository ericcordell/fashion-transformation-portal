# E2E Fashion Transformation Portal

> Track and communicate all work being done within the Walmart Fashion space — covering Strategy, Design, Buying, and Allocation workstreams across the E2E Fashion Transformation program.

A lightweight, self-contained web portal. No build step. No server. No dependencies to install. Open `index.html` in a browser and it just works.

---

## 🔗 Canonical Published URLs

> 🚨 **ABSOLUTE RULE — READ THIS EVERY TIME BEFORE PUBLISHING:**
>
> There are **exactly TWO** valid puppy.walmart.com slugs for this portal.
> **NEVER create a new slug. NEVER publish to any other URL.**
> If you are not publishing to one of the two URLs below, you are doing it wrong.
> This applies to ALL agents, scripts, and humans — no exceptions, ever.

| Environment | URL | When to use |
|---|---|---|
| **PROD** | https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod | Daily scheduler, explicit publish requests |
| **TEST** | https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test | Dev / QA / testing changes — always verify here first |

> 🐶 **Code Puppy agents:** when asked to share or publish this portal, you MUST pass
> `slug = 'e2e-fashion-portal-test'` (for test) or `slug = 'e2e-fashion-portal-prod'` (for prod)
> to the share-puppy agent. Do NOT let the agent invent a new name. Check first.
>
> **The build + publish workflow:**
> ```bash
> python3 build-inlined.py           # step 1: build portal-final.html
> python3 publish-portal.py --test   # step 2: canary preflight → real publish
> # verify at TEST URL, then:
> python3 validate-portal.py         # step 3: full card validation report
> python3 publish-portal.py --prod   # step 4: validation gate runs automatically;
>                                    #          aborts if any critical card has errors
> ```
>
> **Validation gate (built into --prod publish):**
> `publish-portal.py --prod` automatically runs `validate-portal.py --critical`
> before uploading. If any critical card has a missing/invalid status, empty
> statusLabel, or garbage targetDate — the publish is **hard-aborted**. Fix the
> errors, rebuild, and try again.
>
> Run `python3 validate-portal.py` manually for the full report across all cards.
> Use `--critical` to see only `critical: true` cards. Use `--quiet` to suppress
> warnings and show errors only.
>
> **⚠️ CRITICAL — The "shadow record" trap (the real reason updates didn't show up)**
>
> puppy.walmart.com stores pages in two separate records when access levels differ:
>   - The **original private page** (created via web UI) always wins in the viewer
>   - API uploads with `access_level: "business"` write to a shadow record the viewer never serves
>
> Symptom: uploads return HTTP 200 + incrementing version numbers, but the viewer
> shows the same old content with an old date and a `private` badge in the toolbar.
>
> Fix: Go to puppy.walmart.com/sharing dashboard, find the row for
> `e2e-fashion-portal-test`, click the row's delete button (NOT the in-viewer
> trash icon — use the dashboard table row), confirm, then re-publish via API.
> The API record becomes the sole owner and the viewer finally serves it.
>
> **❌ DO NOT re-create the page through the web UI** — that recreates the private
> record and you're back to square one.
>
> **How to check:** viewer toolbar shows `business` badge ✔ or `private` badge ⚠️
>
> **Correct publish API:**
> ```
> POST https://puppy.walmart.com/api/sharing/upload
> Authorization: Bearer {puppy_token from ~/.code_puppy/puppy.cfg}
> Content-Type: application/json
> Body: {"name": "...", "business": "e0c0lzr", "html_content": "...", "access_level": "business"}
> ```
> ❌ `PUT /api/sharing/{owner}/{slug}` → broken-pipe/401
> ❌ Chrome cookie auth → does not work
> ❌ `{content: html}` → wrong field, use `html_content`
>
> **If portal still looks unchanged after a correct publish:**
> 1. Check viewer toolbar badge: `private` = shadow record problem (see above)
> 2. Hard-refresh: ⌘+Shift+R (Mac) or Ctrl+Shift+R (Win)
> 3. Check script output: did canary AND real both print ✅ with consecutive versions?
> 4. Try Incognito window to bypass browser session cache

---

## 📜 Publishing Tenets (Non-Negotiable)

These tenets govern how ALL changes to the E2E Fashion Portal are made, tested, and deployed.
Every developer, agent, and script MUST follow these — no exceptions.

### 1. Always Two Portals: TEST → PROD
- There are **exactly two portals**: TEST and PROD. No third portal. No ad-hoc copies in `~/`.
- **All changes go to TEST first.** Verify at the TEST URL before touching PROD.
- PROD is only updated after TEST has been verified and confirmed working.

### 2. TEST and PROD Must Be In Sync After Deployment
- After every successful deployment to PROD, TEST and PROD must contain **identical content**.
- If they diverge, it means either (a) TEST has unpublished WIP, or (b) someone skipped the workflow. Fix immediately.

### 3. All Changes Go Through Git
- Every change — code, data, content, config — is committed to the GitHub repo: `github.com/ericcordell/fashion-transformation-portal`.
- **Never make edits only to the live portal** without updating the source files in git.
- Commit often, with descriptive messages. We use git to roll forward and back in time.

### 4. Update the README for Every Significant Change
- If a change affects the portal's structure, workflow, data model, publishing process, or adds/removes a feature — **update this README**.
- Future you (and future agents) will thank present you.

### 5. Consistent Publishing Process
- **One-command update:** `python3 e2e-update.py` (Confluence pull → build → publish TEST+PROD → git commit)
- **Manual publish:** `python3 build-inlined.py` → `python3 publish-portal.py --test` → verify → `python3 validate-portal.py` → `python3 publish-portal.py --prod`
- **`--prod` is gated:** `publish-portal.py --prod` runs `validate-portal.py --critical` automatically and aborts if any critical card has an error. You cannot skip this.
- **Test-only deploy:** `python3 e2e-update.py --test-only` (publishes to TEST only, skips PROD)
- **Never publish to PROD without verifying TEST first.**

### 6. No Orphaned Files
- The portal lives in `~/Downloads/fashion-portal/`. Period.
- Do NOT leave standalone `.html` copies in `~/`, `~/Desktop/`, or anywhere else.
- If you find orphaned portal files outside the project directory, delete them.

### 7. Access Levels Are Sacred
| Environment | Access Level | Rationale |
|---|---|---|
| **PROD** | `public` | Anyone with the link can view |
| **TEST** | `business` | Org-only, staging content |

PROD must **never** be published with `business`, `restricted`, or any constrained level.

---

## 📝 Changelog

### April 15, 2026
- **Switched Confluence extraction to REST API** — no more browser/AppleScript dependency!
  - Uses Chrome cookies via `browser_cookie3` for auth — no permissions required
  - Fetches live data every run without needing Chrome open
  - Faster: ~16s vs 45-65s for browser-based extraction
- Fixed `--test-only` bug (from April 14): was skipping TEST and publishing to PROD
- Fixed OPIF oscillation bug: `completed` cards now excluded from OPIF sync updates
- Removed all Chrome AppleScript extraction code — replaced with `_confluence_api_extract()`
- PROD v50, TEST v135

### April 14, 2026
- Updated Confluence data sync — 21 OPIF status/date fields refreshed (PROD v42)
- Fixed `--test-only` bug in `e2e-update.py` — was publishing PROD instead of TEST
- Added Publishing Tenets section to this README
- Added `sync.log` to `.gitignore`
- Updated portal header date: `March 2026` → `April 2026`
- Changed portal header label: `Confidential` → `Internal Use` (PROD is public access)

---

## ✨ Features

- **Four workstream pillars** (Strategy, Design, Buying, Allocation) with live status badges
- **Workstream summary modal** — click any pillar header for an instant RYG health report by quarter
- **Full roadmap popout** — all deliverables across quarters with status filtering
- **Card detail modal** — description, business benefit, tech integration, owners, resources & email inquiry
- **E2E phase flow bar** — color-coded by workstream
- Walmart brand colors throughout (blue `#0053e2`, spark gold `#FFC220`)

---

## 📁 File Structure

```
fashion-portal/
├── index.html              # Main portal shell (UI layout, modals, inline render logic)
├── portal.css              # All shared styles (extracted to keep index.html < 600 lines)
│
├── data.js                 # Core constants: PHASES, QUARTER_META, BADGE_CLASS, helpers
├── data-strategy.js        # Strategy pillar card definitions
├── data-design.js          # Design pillar card definitions
├── data-buying.js          # Buying pillar card definitions
├── data-allocation.js      # Allocation pillar cards + PILLARS[] assembly
│
├── roadmap-window.js       # Full roadmap popout modal (IIFE, z-index 98)
└── summary-modal.js        # Workstream summary modal (IIFE, z-index 96)
```

> **600-line rule:** every file is kept under 600 lines. If a file grows past that, split it.

---

## 🔄 Making Changes

### Updating a card's status
Open the relevant pillar file (e.g. `data-buying.js`) and change:
```js
status: 'green',      // 'completed' | 'green' | 'yellow' | 'red' | 'roadmap'
statusLabel: 'Green — On Track',
pathToGreen: '...',   // only needed for yellow/red
```

### Adding a new deliverable
1. Open the relevant `data-<workstream>.js` file
2. Add a new card object to the `CARDS_*` array (copy an existing card as a template)
3. Give it a unique `id` string
4. Assign the right `quarter`: `'completed' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Future'`

### Updating owner names/emails
Each card has an `owners` object:
```js
owners: {
  businessPartner:    { name: 'Brett Reid',     email: 'b0r0xyz@walmart.com' },
  transformationLead: { name: 'Prasanth C',     email: '...' },
  productLead:        { name: 'Michael Allen',  email: '...' },
  uxLead:             { name: 'TBD',            email: '' },
  softwareLead:       { name: 'TBD',            email: '' },
},
```
Or use the `pptOwners(bp, tl, pl)` helper for a quick 3-field fill.

### Adding resource links (OPIF, BRD, PRD, UX Demo)
```js
resources: res(
  'https://opif-link',
  'https://brd-link',
  'https://prd-link',
  'https://ux-demo-link'
),
```

---

## 🚀 Committing & Pushing Changes

```bash
cd /Users/e0c0lzr/Downloads/fashion-portal

# Make your edits, then:
git add -A
git commit -m "brief description of what changed"
git push
```

That's it. No build, no deploy — the portal is a flat HTML file.

---

## 📅 Walmart FY Quarter Reference

| Quarter | Months       |
|---------|--------------|
| Q1      | Feb – Apr    |
| Q2      | May – Jul    |
| Q3      | Aug – Oct    |
| Q4      | Nov – Jan    |

---

## 🤝 Collaborators

To invite a colleague to the repo:
1. Go to **github.com/ericcordell/fashion-transformation-portal**
2. **Settings → Collaborators → Add people**
3. Enter their GitHub username — they'll get an email invite

---

*Built with plain HTML + Tailwind CDN + vanilla JS. No framework, no build tools, no dependencies to update.*