#!/usr/bin/env python3
"""generate-jira-pat.py — Securely generate a Jira Personal Access Token.
Password is entered via hidden prompt and never stored or logged.
"""
import json
import getpass
import urllib.request
import urllib.error
import base64
import sys

JIRA_URL  = "https://jira.walmart.com"
TOKEN_NAME = "fashion-portal-sync"
EXPIRY_DAYS = 180

def main():
    print("\n🔑 Jira PAT Generator — fashion-portal-sync")
    print("━" * 45)
    print(f"Instance : {JIRA_URL}")
    print(f"Token    : {TOKEN_NAME}")
    print(f"Expiry   : {EXPIRY_DAYS} days")
    print()

    username = input("Walmart ID (e.g. e0c0lzr): ").strip()
    password = getpass.getpass("Password (hidden):         ")

    if not username or not password:
        print("\n❌ Username and password are required.")
        sys.exit(1)

    # Build Basic Auth header
    creds   = base64.b64encode(f"{username}:{password}".encode()).decode()
    payload = json.dumps({"name": TOKEN_NAME, "expirationDuration": EXPIRY_DAYS}).encode()

    req = urllib.request.Request(
        f"{JIRA_URL}/rest/pat/latest/tokens",
        data    = payload,
        method  = "POST",
        headers = {
            "Authorization": f"Basic {creds}",
            "Content-Type" : "application/json",
            "Accept"       : "application/json",
        },
    )

    print("\n⏳ Contacting Jira...")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 401:
            print("\n❌ 401 Unauthorized — check your Walmart ID and password.")
        elif e.code == 403:
            print("\n❌ 403 Forbidden — your account may not have PAT access yet.")
            print("   Request access: https://dl.walmart.com/groups/jira-development-api")
        elif e.code == 400:
            print(f"\n❌ 400 Bad Request — {body[:300]}")
        else:
            print(f"\n❌ HTTP {e.code} — {body[:300]}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Connection error: {e}")
        sys.exit(1)

    token = data.get("token", "")
    token_id = data.get("id", "")
    expires = data.get("expiringAt", "")

    print()
    print("✅ Token created successfully!")
    print("━" * 45)
    print(f"ID      : {token_id}")
    print(f"Expires : {expires}")
    print()
    print("🔐 YOUR TOKEN (copy this NOW — shown only once):")
    print()
    print(f"  {token}")
    print()
    print("━" * 45)
    print("Next step — test your token:")
    print()
    print(f"  python3 sync-from-jira.py --token {token} --probe")
    print()
    print("Or save it to .env (already in .gitignore):")
    print()
    print(f"  echo 'JIRA_TOKEN={token}' >> .env")
    print()

if __name__ == "__main__":
    main()
