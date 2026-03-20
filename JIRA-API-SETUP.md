# 🔑 Jira API Access — Setup Guide

## What We Found

| Finding | Detail |
|---|---|
| Jira Version | 9.12.22 Server (Enterprise JIRA) |
| Auth Mechanism | PingFed SSO only — Basic Auth fully disabled |
| PAT Endpoint | `https://jira.walmart.com/rest/pat/latest/tokens` ✅ alive |
| Basic Auth | ❌ Disabled everywhere (including PAT endpoint) |
| PAT Generation | Browser UI only (after SSO login + AD group) |

## The Auth Chain

```
Basic Auth disabled (PingFed SSO only)
  → Cannot create PAT via API/curl
    → Must use Jira browser UI
      → PAT option hidden until AD group approved
        → Request "Jira API Integration" group in MGM
```

## ✅ How to Get Your PAT (One-Time Setup)

### Step 1 — Request AD Group Access

The "Personal Access Tokens" option in Jira is gated behind an AD group.
Request access here (replaces the old `dl.walmart.com/groups/jira-development-api`):

> **https://mgm.walmart.com/groups/74eac2b7-660f-4d5d-b6a5-8ad33dc9c47c**
> Group name: **Jira API Integration**

Approval is typically 1 business day.
Slack for help: **`#atlassian-api-auth-token-migration`**

### Step 2 — Generate PAT in Jira UI (after approval)

1. Go to **https://jira.walmart.com**
2. Click your **profile avatar** (top-right)
3. Select **"Personal Access Tokens"** (now visible after AD group approval)
4. Click **"Create token"**
   - Name: `fashion-portal-sync`
   - Expiry: **180 days** (max)
5. **Copy the token immediately** — shown only once!

### Step 3 — Test Your Token

```bash
export JIRA_TOKEN="your-token-here"

# Test: confirm who you are
curl -s "https://jira.walmart.com/rest/api/2/myself" \n  -H "Authorization: Bearer $JIRA_TOKEN" | python3 -m json.tool

# Discover custom field IDs (Status Color, Target Quarter, Tech Rank)
python3 sync-from-jira.py --token "$JIRA_TOKEN" --probe
```

### Step 4 — Dry Run

```bash
# Preview all changes without writing anything
python3 sync-from-jira.py --token "$JIRA_TOKEN" --dry-run
```

### Step 5 — Full Sync + Rebuild + Deploy

```bash
python3 sync-from-jira.py --token "$JIRA_TOKEN"
git diff
python3 build-inlined.py
open portal-inlined.html
```

---

## What the Sync Script Pulls Per OPIF

| Portal Field | Jira Source | Fallback |
|---|---|---|
| `status` | Custom: Status Color | Derived from workflow status |
| `statusLabel` | Status Color + Activity Type | e.g. `"Yellow — Pending Sizing"n| `quarter` | Custom: Target Quarter | Derived from due date month |
| `targetDate` | `duedate` field | Unchanged if empty |
| `priority` | `priority` field | P1/P2/P3 normalized |
| `techRank` | Custom: Tech Rank | Blank → card auto-becomes Backlog |

---

## Token Safety

⚠️ **Never commit your token to git.** `.env` is already in `.gitignore`.

```bash
# Store safely
echo 'JIRA_TOKEN=your-token-here' >> .env

# Use in scripts
export $(cat .env | xargs)
python3 sync-from-jira.py --token "$JIRA_TOKEN"
```

---

## Quick Reference

| Task | Link / Command |
|---|---|
| Request AD group | https://mgm.walmart.com/groups/74eac2b7-660f-4d5d-b6a5-8ad33dc9c47c |
| Generate PAT (after approval) | https://jira.walmart.com → Profile → Personal Access Tokens |
| Slack support | `#atlassian-api-auth-token-migration` |
| Probe custom fields | `python3 sync-from-jira.py --token $TOKEN --probe` |
| Dry run | `python3 sync-from-jira.py --token $TOKEN --dry-run` |
| Full sync | `python3 sync-from-jira.py --token $TOKEN` |
| Rebuild portal | `python3 build-inlined.py` |