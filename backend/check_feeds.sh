#!/bin/bash
set -euo pipefail
urls=(
  "https://techcrunch.com/feed/"
  "https://www.theverge.com/rss/index.xml"
  "http://feeds.arstechnica.com/arstechnica/index/"
  "https://www.wired.com/feed/rss"
  "https://www.itmedia.co.jp/rss/"
  "https://japan.zdnet.com/rss/"
)

for url in "${urls[@]}"; do
  echo
  echo "=== URL: $url ==="
  echo "-> curl -I -L -m 20"
  curl -sS -I -L -m 20 "$url" 2>&1 || echo "curl failed for $url"
  echo "-> curl body (first 10 lines)"
  curl -sS -L -m 20 "$url" 2>/dev/null | sed -n '1,10p' || true
  echo "=== end ==="
done
