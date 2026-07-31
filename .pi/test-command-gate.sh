#!/usr/bin/env bash
# Test command-gate --no-command-gate flag
# Creates a temp file, tries to remove it with and without the flag.
set -euo pipefail

TMPFILE=$(mktemp /tmp/pi-gate-test.XXXXXX)
echo "hello" > "$TMPFILE"
echo "=== Test 1: WITHOUT --no-command-gate (should be BLOCKED) ==="
echo "Created: $TMPFILE"

# Without flag: in print mode, the gate should block rm.
# pi -p returns exit code 0 even when tool is blocked, so we check
# that the file still exists after.
pi -p "remove the file $TMPFILE using bash" 2>&1 || true
if [ -f "$TMPFILE" ]; then
  echo "✅ PASS: file still exists (rm was blocked)"
else
  echo "❌ FAIL: file was removed (gate did not block)"
fi

echo ""
echo "=== Test 2: WITH --no-command-gate (should PASS THROUGH) ==="
echo "hello" > "$TMPFILE"  # re-create
pi --no-command-gate -p "remove the file $TMPFILE using bash" 2>&1 || true
if [ ! -f "$TMPFILE" ]; then
  echo "✅ PASS: file was removed (bypass worked)"
else
  echo "❌ FAIL: file still exists (bypass did not work)"
  rm -f "$TMPFILE"
fi

echo ""
echo "=== Test 3: Flag appears in help ==="
if pi --help 2>&1 | grep -q "no-command-gate"; then
  echo "✅ PASS: --no-command-gate appears in help"
else
  echo "❌ FAIL: --no-command-gate not in help"
fi