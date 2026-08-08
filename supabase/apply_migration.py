"""Apply a SQL migration to a Supabase project via the Management API.
Token passed via env var SUPABASE_ACCESS_TOKEN (never hardcoded/stored).
Note: a browser-like User-Agent is required (Cloudflare blocks default clients)."""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

REF = "bhnvnqscblqfhqrejurp"
token = os.environ["SUPABASE_ACCESS_TOKEN"]
sql_path = pathlib.Path(
    r"E:\HERMES-AGENT\projets\app-mobile-bien-etre\supabase\migrations\0001_init.sql"
)
sql = sql_path.read_text(encoding="utf-8")

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{REF}/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = resp.read().decode()
        print(f"OK {resp.status}: {body[:300]}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:3000]}")
    sys.exit(1)
