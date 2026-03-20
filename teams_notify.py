"""
teams_notify.py — Sends daily sync summaries to Teams via Microsoft Graph API.

Auth:  MSAL device-code flow (one-time browser login, then token is cached).
Token: ~/.walmart_teams_sync_token.json  (chmod 600, auto-refreshed ~90 days).

Usage:
    # One-time auth setup:
    python3 teams_notify.py

    # From daily-sync.py:
    from teams_notify import notify_sync_complete
    notify_sync_complete(summary)
"""

import json
import sys
import time
from pathlib    import Path
from typing     import Optional

try:
    import msal
    import urllib.request
    import urllib.error
except ImportError:
    msal = None  # type: ignore

# ── Walmart / Azure AD constants (from msgraph agent) ─────────────────────────
TENANT_ID  = "3cbcc3d3-094d-4006-9849-0d11d61f484d"
CLIENT_ID  = "3a08dbfd-336c-435d-ad3d-0d48630462aa"   # Code Puppy app (Walmart AAD)
AUTHORITY  = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPES     = ["https://graph.microsoft.com/Chat.ReadWrite"]
GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# Teams self-notes chat — no channel ID needed, always works for personal msgs
SELF_CHAT_ID = "48:notes"

# Token cache lives next to the script so the LaunchAgent can always find it
TOKEN_CACHE = Path(__file__).parent / ".teams_token_cache.json"


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _get_app() -> "msal.PublicClientApplication":
    cache = msal.SerializableTokenCache()
    if TOKEN_CACHE.exists():
        cache.deserialize(TOKEN_CACHE.read_text())
    app = msal.PublicClientApplication(CLIENT_ID, authority=AUTHORITY,
                                       token_cache=cache)
    return app, cache


def _save_cache(cache: "msal.SerializableTokenCache") -> None:
    if cache.has_state_changed:
        TOKEN_CACHE.write_text(cache.serialize())
        TOKEN_CACHE.chmod(0o600)


def get_token() -> Optional[str]:
    """Return a valid access token from cache, or None if not authed yet."""
    if msal is None:
        return None
    app, cache = _get_app()
    accounts = app.get_accounts()
    if not accounts:
        return None
    result = app.acquire_token_silent(SCOPES, account=accounts[0])
    _save_cache(cache)
    return result.get("access_token") if result else None


def auth_interactive() -> str:
    """Run device-code flow to authenticate. Prints URL + code for user."""
    if msal is None:
        raise RuntimeError("msal not installed — run: uv pip install msal")
    app, cache = _get_app()
    flow = app.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        raise RuntimeError(f"Device flow failed: {flow}")

    print("\n" + "═" * 60)
    print("🔐  ONE-TIME TEAMS AUTH REQUIRED")
    print("═" * 60)
    print(f"  1. Open: {flow['verification_uri']}")  
    print(f"  2. Enter code: {flow['user_code']}")
    print(f"  3. Sign in with your Walmart credentials")
    print("═" * 60 + "\n")

    result = app.acquire_token_by_device_flow(flow)  # blocks until user logs in
    if "access_token" not in result:
        raise RuntimeError(f"Auth failed: {result.get('error_description', result)}")

    _save_cache(cache)
    print("✅  Authenticated! Token cached — you won't need to do this again.\n")
    return result["access_token"]


# ── Graph API ─────────────────────────────────────────────────────────────────

def _graph_post(path: str, body: dict, token: str) -> dict:
    data    = json.dumps(body).encode()
    req     = urllib.request.Request(
        f"{GRAPH_BASE}{path}",
        data    = data,
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
        },
        method = "POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Graph API {e.code}: {e.read().decode()}") from e


def send_to_self(html: str, token: str) -> None:
    """Post an HTML message to the user's own Teams Notes."""
    _graph_post(
        f"/chats/{SELF_CHAT_ID}/messages",
        {"body": {"contentType": "html", "content": html}},
        token,
    )


# ── Message formatter ─────────────────────────────────────────────────────────

def _build_html(summary: dict) -> str:
    """
    Build a tidy Teams HTML card from the sync summary dict.

    Expected keys (all optional with sensible defaults):
        date          str   "2026-03-20"
        started_at    str   "08:00:03 PDT"
        duration_s    float seconds taken
        cards_updated int
        changes       list  of dicts: {card, field, from_, to}
        errors        list  of str
        published     bool  whether puppy.walmart.com was updated
    """
    date         = summary.get("date", time.strftime("%Y-%m-%d"))
    started_at   = summary.get("started_at", "—")
    duration_s   = summary.get("duration_s")
    cards_updated= summary.get("cards_updated", 0)
    changes      = summary.get("changes", [])
    errors       = summary.get("errors", [])
    published    = summary.get("published", False)

    duration_str = f"{duration_s:.1f}s" if duration_s is not None else "—"
    status_color = "#ea1100" if errors else "#2a8703"
    status_icon  = "❌" if errors else "✅"
    status_label = f"{len(errors)} error(s)" if errors else "Completed successfully"

    # Changes table rows
    change_rows = ""
    if changes:
        rows = "".join(
            f"<tr>"
            f"<td style='padding:3px 10px 3px 0;font-size:13px;color:#475569;'>{c.get('card','—')}</td>"
            f"<td style='padding:3px 10px 3px 0;font-size:13px;color:#64748b;'>{c.get('field','—')}</td>"
            f"<td style='padding:3px 10px 3px 0;font-size:13px;color:#dc2626;text-decoration:line-through;'>{c.get('from_','—')}</td>"
            f"<td style='padding:3px 0;font-size:13px;color:#16a34a;font-weight:600;'>{c.get('to','—')}</td>"
            f"</tr>"
            for c in changes
        )
        change_rows = f"""
        <p style='margin:14px 0 6px;font-size:13px;font-weight:600;color:#1e293b;'>📋 Changes ({len(changes)})</p>
        <table style='border-collapse:collapse;width:100%;'>
          <thead><tr>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 10px 4px 0;'>Card</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 10px 4px 0;'>Field</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 10px 4px 0;'>Was</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0;'>Now</th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>"""
    elif cards_updated == 0:
        change_rows = "<p style='margin:14px 0 0;font-size:13px;color:#94a3b8;font-style:italic;'>No changes detected — portal is already up to date.</p>"

    # Errors block
    error_block = ""
    if errors:
        err_items = "".join(f"<li style='font-size:12px;color:#dc2626;margin:2px 0;'>{e}</li>" for e in errors)
        error_block = f"""
        <p style='margin:14px 0 6px;font-size:13px;font-weight:600;color:#dc2626;'>⚠️ Errors</p>
        <ul style='margin:0;padding-left:18px;'>{err_items}</ul>"""

    published_note = (
        "<span style='color:#2a8703;font-weight:600;'>✅ Portal republished to puppy.walmart.com</span>"
        if published else
        "<span style='color:#94a3b8;'>No publish needed (no changes)</span>"
    )

    return f"""
<div style='font-family:Segoe UI,Arial,sans-serif;max-width:580px;'>

  <div style='border-left:4px solid {status_color};padding:10px 16px;
              background:#f8fafc;border-radius:0 6px 6px 0;margin-bottom:14px;'>
    <p style='margin:0;font-size:16px;font-weight:700;color:#0f172a;'>
      {status_icon} E2E Fashion Transformation Portal — Daily Sync
    </p>
    <p style='margin:4px 0 0;font-size:13px;color:{status_color};font-weight:600;'>
      {status_label}
    </p>
  </div>

  <table style='border-collapse:collapse;width:100%;margin-bottom:4px;'>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;width:120px;'>📅 Date</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;font-weight:600;'>{date}</td>
    </tr>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>🕗 Ran at</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{started_at}</td>
    </tr>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>⏱ Duration</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{duration_str}</td>
    </tr>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>🗂 Cards scanned</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{summary.get("cards_scanned", "—")}</td>
    </tr>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>📝 Publish</td>
      <td style='padding:3px 0;font-size:13px;'>{published_note}</td>
    </tr>
  </table>

  {change_rows}
  {error_block}

  <p style='margin:16px 0 0;font-size:11px;color:#cbd5e1;'>
    🤖 Automated via E2E Fashion Portal daily-sync.py
    &nbsp;·&nbsp;
    <a href='https://puppy.walmart.com/sharing/e0c0lzr/e2e-fashion-portal'
       style='color:#0053e2;'>View portal</a>
  </p>
</div>
"""


# ── Public API (called from daily-sync.py) ────────────────────────────────────

def notify_sync_complete(summary: dict) -> bool:
    """
    Send the daily sync summary to Teams Notes.
    Returns True on success, False if not authed or on error (non-fatal).
    """
    token = get_token()
    if token is None:
        print("[teams_notify] ⚠️  Not authenticated — skipping Teams notification.")
        print("[teams_notify]    Run:  python3 teams_notify.py  to set up auth.")
        return False
    try:
        html = _build_html(summary)
        send_to_self(html, token)
        print("[teams_notify] ✅  Summary sent to Teams Notes.")
        return True
    except Exception as e:
        # Never crash the sync just because Teams failed
        print(f"[teams_notify] ❌  Failed to send Teams notification: {e}")
        return False


# ── Run directly for one-time auth setup ─────────────────────────────────────

if __name__ == "__main__":
    print("E2E Fashion Portal — Teams Notifier Setup")
    token = auth_interactive()

    # Send a test message so they can verify it worked
    test_summary = {
        "date":          time.strftime("%Y-%m-%d"),
        "started_at":    time.strftime("%H:%M:%S PDT"),
        "duration_s":    0.42,
        "cards_scanned": 0,
        "cards_updated": 0,
        "changes":       [],
        "errors":        [],
        "published":     False,
    }
    # Override the no-changes message for the test
    html = _build_html(test_summary).replace(
        "No changes detected — portal is already up to date.",
        "🧪 This is a test message — auth is working!",
    )
    send_to_self(html, token)
    print("✅  Test message sent to your Teams Notes — check Teams to confirm!")