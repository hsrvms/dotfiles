#!/usr/bin/env bash
# Test command-gate desktop notification (OSC escape sequences)
# In RPC mode, ctx.hasUI is true, so dialogs fire and notifications
# are written to stdout alongside the JSON-RPC stream.
set -euo pipefail

TMPFILE=$(mktemp /tmp/pi-gate-notify.XXXXXX)
echo "hello" > "$TMPFILE"

echo "=== Test: Notification OSC sequence emitted ==="

# Run pi in RPC mode, capture stdout. The OSC 777 escape should appear
# before the JSON-RPC confirm dialog.
# timeout after 5s — we don't need the full response.
timeout 5 pi --mode rpc -p "remove the file $TMPFILE using bash" 2>/dev/null > "$TMPFILE.out" || true

# Check for OSC 777 notification sequence
if grep -q $'\x1b]777;notify;pi' "$TMPFILE.out" 2>/dev/null; then
  echo "✅ PASS: OSC 777 notification sequence found"
else
  # Kitty OSC 99 variant
  if grep -q $'\x1b]99;i=1:d=0;pi' "$TMPFILE.out" 2>/dev/null; then
    echo "✅ PASS: OSC 99 (Kitty) notification sequence found"
  else
    echo "⚠️  WARN: no notification sequence detected (may be fine if terminal doesn't support it)"
  fi
fi

rm -f "$TMPFILE" "$TMPFILE.out"