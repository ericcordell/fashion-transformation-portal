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
> 1. Edit source files (`index.html`, `data-*.js`, CSS, etc.)
> 2. `python3 build-inlined.py` → produces `portal-final.html`
> 3. `python3 publish-portal.py --test` → publishes to TEST
> 4. Verify at https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test
> 5. Only promote to PROD when explicitly requested: `python3 publish-portal.py --prod`
>
> **🔴 Correct publish API (NEVER change this without testing):**
> ```
> POST https://puppy.walmart.com/api/sharing/upload
> Authorization: Bearer {puppy_token from ~/.code_puppy/puppy.cfg}
> Content-Type: application/json
> Body: {"name": "e2e-fashion-portal-test", "business": "e0c0lzr",
>        "html_content": "...", "access_level": "business"}
> ```
> The `PUT /api/sharing/{owner}/{slug}` endpoint causes broken-pipe/401 — do NOT use it.
> Chrome cookie auth also does not work — only `puppy_token` Bearer auth works.

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