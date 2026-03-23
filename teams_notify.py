"""
teams_notify.py — Posts daily sync summaries to Teams via Power Automate.

Setup (one-time, ~3 minutes):
  1. Go to https://make.powerautomate.com
  2. Create > Automated cloud flow > skip ("build my own")
  3. Trigger: "When an HTTP request is received"  (leave schema blank)
  4. + New step: "Post message in a chat or channel"
       Post as: Flow bot  |  Post in: Chat with Flow bot
       Recipient: YOUR Walmart email
       Message: (click Expression tab) → triggerBody()?['html']
  5. Save → copy the HTTP POST URL that appears on the trigger card
  6. Paste it into Downloads/fashion-portal/.env as:
       TEAMS_PA_URL=https://prod-xx.westus.logic.azure.com/...

That's it. The sync script calls notify_sync_complete() and Teams gets the message.
"""

import json
import os
import time
from pathlib import Path
from typing  import Optional
import urllib.request
import urllib.error

# ── Config ─────────────────────────────────────────────────────────────────────
_ENV_FILE = Path(__file__).parent / '.env'


def _pa_url() -> Optional[str]:
    """Read the Power Automate trigger URL from .env (TEAMS_PA_URL=...)."""
    if _ENV_FILE.exists():
        for line in _ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith('TEAMS_PA_URL='):
                return line.split('=', 1)[1].strip()
    return os.environ.get('TEAMS_PA_URL')


# ── Message HTML builder ───────────────────────────────────────────────────────

def _build_html(summary: dict) -> str:
    """
    Build a tidy HTML Teams card from the sync summary.

    summary keys (all optional):
        date          str    "2026-03-21"
        started_at    str    "08:00:03 PDT"
        duration_s    float  seconds
        cards_scanned int
        cards_updated int
        changes       list   [{card, field, from_, to}]
        errors        list   [str]
        published     bool
    """
    date          = summary.get('date',          time.strftime('%Y-%m-%d'))
    started_at    = summary.get('started_at',    '—')
    duration_s    = summary.get('duration_s')
    cards_scanned = summary.get('cards_scanned', '—')
    cards_updated = summary.get('cards_updated', 0)
    changes       = summary.get('changes',       [])
    errors        = summary.get('errors',        [])
    published     = summary.get('published',     False)

    duration_str  = f"{duration_s:.1f}s" if duration_s is not None else '—'
    status_color  = '#ea1100' if errors else '#2a8703'
    status_icon   = '❌' if errors else '✅'
    status_label  = f"{len(errors)} error(s) — check sync.log" if errors else 'Completed successfully'

    # Changes table
    if changes:
        rows = ''.join(
            f"<tr>"
            f"<td style='padding:3px 12px 3px 0;font-size:13px;color:#475569;'>{c.get('card','—')}</td>"
            f"<td style='padding:3px 12px 3px 0;font-size:13px;color:#64748b;'>{c.get('field','—')}</td>"
            f"<td style='padding:3px 12px 3px 0;font-size:13px;color:#dc2626;text-decoration:line-through;'>{c.get('from_','—')}</td>"
            f"<td style='padding:3px 0;font-size:13px;color:#16a34a;font-weight:600;'>{c.get('to','—')}</td>"
            f"</tr>"
            for c in changes
        )
        changes_block = f"""
        <p style='margin:14px 0 6px;font-size:13px;font-weight:600;color:#1e293b;'>
          📋 Changes detected ({len(changes)})
        </p>
        <table style='border-collapse:collapse;'>
          <thead><tr>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 12px 4px 0;'>Card</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 12px 4px 0;'>Field</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0 12px 4px 0;'>Was</th>
            <th style='text-align:left;font-size:11px;color:#94a3b8;padding:0;'>Now</th>
          </tr></thead>
          <tbody>{rows}</tbody>
        </table>"""
    else:
        changes_block = (
            "<p style='margin:14px 0 0;font-size:13px;color:#94a3b8;font-style:italic;'>"
            "No changes detected — portal is already up to date.</p>"
        )

    # Errors block
    errors_block = ''
    if errors:
        items = ''.join(
            f"<li style='font-size:12px;color:#dc2626;margin:2px 0;'>{e}</li>"
            for e in errors
        )
        errors_block = f"""
        <p style='margin:14px 0 6px;font-size:13px;font-weight:600;color:#dc2626;'>⚠️ Errors</p>
        <ul style='margin:0;padding-left:18px;'>{items}</ul>"""

    published_note = (
        "<span style='color:#2a8703;font-weight:600;'>"
        "✅ Portal republished to "
        "<a href='https://puppy.walmart.com/sharing/e0c0lzr/fashion-portal'>puppy.walmart.com</a>"
        "</span>"
        if published else
        "<span style='color:#94a3b8;'>No publish (no changes)</span>"
    )

    return f"""
<div style='font-family:Segoe UI,Arial,sans-serif;max-width:560px;'>
  <div style='border-left:4px solid {status_color};padding:10px 16px;
              background:#f8fafc;border-radius:0 6px 6px 0;margin-bottom:14px;'>
    <p style='margin:0;font-size:16px;font-weight:700;color:#0f172a;'>
      {status_icon}&nbsp; E2E Fashion Transformation Portal — Daily Sync
    </p>
    <p style='margin:4px 0 0;font-size:13px;color:{status_color};font-weight:600;'>
      {status_label}
    </p>
  </div>

  <table style='border-collapse:collapse;width:100%;margin-bottom:4px;'>
    <tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;width:130px;'>📅 Date</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;font-weight:600;'>{date}</td>
    </tr><tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>🕗 Ran at</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{started_at}</td>
    </tr><tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>⏱ Duration</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{duration_str}</td>
    </tr><tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>🗂 Cards scanned</td>
      <td style='padding:3px 0;font-size:13px;color:#1e293b;'>{cards_scanned}</td>
    </tr><tr>
      <td style='padding:3px 16px 3px 0;font-size:13px;color:#64748b;'>📝 Publish</td>
      <td style='padding:3px 0;font-size:13px;'>{published_note}</td>
    </tr>
  </table>

  {changes_block}
  {errors_block}

  <p style='margin:16px 0 0;font-size:11px;color:#cbd5e1;'>
    🤖 E2E Fashion Portal · daily-sync.py
  </p>
</div>
"""


# ── Sender ─────────────────────────────────────────────────────────────────────

def notify_sync_complete(summary: dict) -> bool:
    """
    POST the sync summary as a Teams HTML card via Power Automate.
    Returns True on success.  Never raises — sync must not crash over a notification.
    """
    url = _pa_url()
    if not url:
        print('[teams_notify] ⚠️  TEAMS_PA_URL not set — skipping notification.')
        print('[teams_notify]    Add it to Downloads/fashion-portal/.env')
        print('[teams_notify]    See teams_notify.py header for setup instructions.')
        return False

    html    = _build_html(summary)
    payload = json.dumps({'html': html}).encode()
    req     = urllib.request.Request(
        url,
        data    = payload,
        headers = {'Content-Type': 'application/json'},
        method  = 'POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            r.read()   # drain
        print('[teams_notify] ✅  Summary sent to Teams.')
        return True
    except Exception as e:
        print(f'[teams_notify] ❌  Failed to send Teams notification: {e}')
        return False


# ── Quick test (run directly to verify) ───────────────────────────────────────

if __name__ == '__main__':
    import sys
    url = _pa_url()
    if not url:
        print('❌  TEAMS_PA_URL not set in .env')
        print()
        print('Setup steps:')
        print('  1. https://make.powerautomate.com → New flow → Instant / blank')
        print('  2. Trigger: "When an HTTP request is received"')
        print('  3. + Step: "Post message in a chat or channel"')
        print('       Post as: Flow bot | Post in: Chat with Flow bot')
        print('       Recipient: your Walmart email')
        print('       Message: (Expression) triggerBody()[\'html\']')
        print('  4. Save → copy the trigger URL → paste into .env as TEAMS_PA_URL=...')
        print('  5. Run this script again to send a test message.')
        sys.exit(1)

    print(f'Sending test message to Teams via Power Automate...')
    ok = notify_sync_complete({
        'date':          time.strftime('%Y-%m-%d'),
        'started_at':    time.strftime('%H:%M:%S'),
        'duration_s':    1.23,
        'cards_scanned': 47,
        'cards_updated': 2,
        'changes': [
            {'card': 'opif-325568', 'field': 'statusLabel',
             'from_': 'In Progress',  'to': 'Complete'},
            {'card': 'opif-311042', 'field': 'targetDate',
             'from_': 'May 1, 2026', 'to': 'June 1, 2026'},
        ],
        'errors':    [],
        'published': True,
    })
    sys.exit(0 if ok else 1)