#!/usr/bin/env bash
# refresh.sh — E2E Fashion Portal Daily Refresh
# Usage:
#   ./refresh.sh              # full sync + build + publish to PROD + git push
#   ./refresh.sh --dry-run    # preview Jira changes only, no writes
#   ./refresh.sh --no-publish # sync + build but skip publishing
#   ./refresh.sh --no-git     # skip the git commit + push
#
# First-time setup:
#   python3 generate-jira-pat.py
#   echo 'JIRA_TOKEN=<paste_token>' >> .env
#   chmod +x refresh.sh

set -euo pipefail
cd "$(dirname "$0")"

DRY_RUN=false
SKIP_PUBLISH=false
SKIP_GIT=false

for arg in "$@"; do
  case $arg in
    --dry-run)     DRY_RUN=true ;;
    --no-publish)  SKIP_PUBLISH=true ;;
    --no-git)      SKIP_GIT=true ;;
  esac
done

TODAY=$(date '+%Y-%m-%d')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  🐶  E2E Fashion Portal — Daily Refresh            ┃"
echo "┃  $TIMESTAMP                               ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# ────────────────────────────────────────────────────────────
# STEP 1 — Jira OPIF Sync
# ────────────────────────────────────────────────────────────
echo "🔄 [1/5] Syncing OPIF status from Jira..."
if [ "$DRY_RUN" = true ]; then
  python3 sync-from-jira.py --dry-run
  echo "ℹ️  Dry-run complete — no files changed. Exiting."
  exit 0
else
  python3 sync-from-jira.py
fi
echo "✅ Jira sync done"
echo ""

# ────────────────────────────────────────────────────────────
# STEP 2 — Build portal
# ────────────────────────────────────────────────────────────
echo "🛠  [2/5] Building portal..."
python3 build-inlined.py
echo "✅ Build done"
echo ""

# ────────────────────────────────────────────────────────────
# STEP 3 — Inject OPIF Guide
# ────────────────────────────────────────────────────────────
echo "📖 [3/5] Injecting OPIF Field Guide..."
python3 add-opif-guide.py
echo "✅ OPIF guide injected"
echo ""

if [ "$SKIP_PUBLISH" = true ]; then
  echo "⏩ Skipping publish (--no-publish)"
else
  # ────────────────────────────────────────────────────────────
  # STEP 4 — Publish
  # ────────────────────────────────────────────────────────────
  echo "🚀 [4/5] Publishing..."
  echo "  → Test  (private)"
  python3 publish-portal.py --test
  echo "  → Prod  (public)"
  python3 publish-portal.py --prod
  echo "✅ Published"
  echo ""
fi

if [ "$SKIP_GIT" = true ]; then
  echo "⏩ Skipping git (--no-git)"
else
  # ────────────────────────────────────────────────────────────
  # STEP 5 — Git commit + push
  # ────────────────────────────────────────────────────────────
  echo "💙 [5/5] Committing to GitHub..."
  # Only commit if there are actual changes
  if git diff --quiet && git diff --cached --quiet; then
    echo "  ℹ️  No changes detected — portal already up to date"
  else
    git add -A
    git commit -m "chore: daily portal refresh $TODAY

  Automated OPIF sync from Jira.
  - Status updates propagated from Jira to portal cards
  - data-changelog.js updated with detected changes
  - portal-final.html rebuilt and published to test + prod"
    git push origin main
    echo "✅ Committed and pushed"
  fi
  echo ""
fi

echo ""
echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  ✅  Refresh complete!                                ┃"
echo "┃  🌐 Prod: puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-prod  ┃"
echo "┃  🔒 Test: puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal-test  ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""
