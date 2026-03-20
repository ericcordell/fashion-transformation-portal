# 🔑 Jira API Access — Setup Guide

## What We Found

| Finding | Detail |
|---|---|
| Jira Version | 9.12.22 Server (Enterprise JIRA) |
| Auth Mechanism | OAuth / Bearer Token |
| PAT Endpoint | `https://jira.walmart.com/rest/pat/latest/tokens` ✅ alive |
| Public Endpoint | `https://jira.walmart.com/rest/api/2/serverInfo` (no auth needed) |
| Basic Auth | ❌ Deprecated / disabled |

## Two Paths to API Access

### ✅ Path 1: Personal Access Token (PAT) — Recommended for Us

Fastest, zero-setup, no team required. Works immediately.

#### Step 1 — Generate a PAT in the Jira UI

1. Open: **https://jira.walmart.com/secure/ViewProfile.jspa**
2. Click **"Personal Access Tokens"** in the left sidebar
3. Click **"Create token"**
4. Give it a name: `fashion-portal-sync`
5. Set expiry: **365 days** (or max allowed)
6. Click **Create** → **copy the token immediately** (it won't be shown again!)

#### Step 2 — Test Your Token

```bash
export JIRA_TOKEN="your-token-here"

# Test: who am I?
curl -s "https://jira.walmart.com/rest/api/2/myself" \
  -H "Authorization: Bearer $JIRA_TOKEN" | python3 -m json.tool

# Test: fetch a single OPIF
curl -s "https://jira.walmart.com/rest/api/2/issue/OPIF-344926" \
  -H "Authorization: Bearer $JIRA_TOKEN" | python3 -m json.tool
```

#### Step 3 — Probe Custom Field IDs

```bash
python3 sync-from-jira.py --token $JIRA_TOKEN --probe
```

This will discover which `customfield_XXXXX` IDs map to:
- Status Color
- Target Quarter
- Activity Type
- Tech Rank

#### Step 4 — Dry Run Sync

```bash
# Preview all changes without writing anything
python3 sync-from-jira.py --token $JIRA_TOKEN --dry-run

# Sync a single OPIF first as a test
python3 sync-from-jira.py --token $JIRA_TOKEN --opif OPIF-344926 --dry-run
```

#### Step 5 — Full Sync + Rebuild

```bash
# Run the sync
python3 sync-from-jira.py --token $JIRA_TOKEN

# Review changes
git diff

# Rebuild portal
python3 build-inlined.py

# Preview locally
open portal-inlined.html

# Deploy
# (run share-puppy or manual upload)
```

---

### Path 2: MCP JIRA Server (for Production Services)

Walmart Global Tech built an MCP layer on top of Jira with OAuth 2.0 + RBAC.

- **Base URL:** `https://mcp-jira.walmart.com/mcp/`
- **Auth:** PingFed OAuth 2.0 Bearer Token
- **Slack:** `#help-mcp-jira-confluence`

**To get access:**
1. Request AD Group `GTP-IDE-Developers` at: https://wmlink.wal-mart.com/adgroup
2. For a production service: Submit SSP intake (`SSP00011344`)
3. For dev/testing: Copy `hub-ping` cookie from https://dx.dev.walmart.com

> This path is overkill for our use case. PAT is the right call.

---

## What the Sync Script Does

`sync-from-jira.py` with a valid PAT will:

1. **Probe** — discover all custom field IDs on this Jira instance
2. **Scan** — find every OPIF-linked card across all 4 data files
3. **Fetch** — call `GET /rest/api/2/issue/{OPIF}` for each unique OPIF
4. **Extract** — pull Status Color, Due Date, Quarter, Priority, Tech Rank
5. **Apply** — update matching cards in the JS data files
6. **Report** — show a diff summary of all changes

### Fields Synced Per Card

| Portal Field | Jira Source | Fallback Logic |
|---|---|---|
| `status` | Custom: Status Color | Derived from workflow status name |
| `statusLabel` | Status Color + Activity Type | `"Green — On Track"` etc. |
| `quarter` | Custom: Target Quarter | Derived from due date month |
| `targetDate` | `duedate` field | Stays unchanged if empty |
| `priority` | `priority` field | P1/P2/P3 normalized |
| `techRank` | Custom: Tech Rank | Blank → card auto-becomes Backlog |

---

## Token Safety

⚠️ **Never commit your PAT token to git.**

Store it as an env var:
```bash
export JIRA_TOKEN="your-token"
python3 sync-from-jira.py --token "$JIRA_TOKEN"
```

Or in a `.env` file (already in `.gitignore`):
```
JIRA_TOKEN=your-token-here
```

---

## Quick Reference

```bash
# Generate token at:
https://jira.walmart.com/secure/ViewProfile.jspa

# Test connection:
curl -s https://jira.walmart.com/rest/api/2/myself \
  -H "Authorization: Bearer YOUR_TOKEN"

# Full sync (dry run first!):
python3 sync-from-jira.py --token YOUR_TOKEN --dry-run
python3 sync-from-jira.py --token YOUR_TOKEN

# After sync:
python3 build-inlined.py && open portal-inlined.html
```
