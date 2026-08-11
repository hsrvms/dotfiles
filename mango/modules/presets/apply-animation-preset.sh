#!/usr/bin/env bash
# Apply a mango animation preset.
# Usage: apply-animation-preset.sh <preset-name>
#   presets: default, snappy, smooth, bouncy, minimal
set -euo pipefail

PRESETS_DIR="$(dirname "$(readlink -f "$0")")"
ANIMATION_CONF="$(dirname "$PRESETS_DIR")/animation.conf"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <preset-name>" >&2
  echo "Available presets:" >&2
  ls "$PRESETS_DIR"/*.conf | sed 's/.*\///; s/\.conf$//' | sed 's/^/  /' >&2
  exit 1
fi

PRESET="$1"
SRC="$PRESETS_DIR/$PRESET.conf"

if [[ ! -f "$SRC" ]]; then
  echo "Error: preset '$PRESET' not found." >&2
  ls "$PRESETS_DIR"/*.conf | sed 's/.*\///; s/\.conf$//' | sed 's/^/  /' >&2
  exit 1
fi

cp "$SRC" "$ANIMATION_CONF"
echo "Applied preset '$PRESET' to $ANIMATION_CONF"
echo "Reload mango with SUPER+r to apply."

# Optional: reload via mango ipc if available
if command -v mango-ipc >/dev/null 2>&1; then
  mango-ipc reload 2>/dev/null && echo "Configuration reloaded."
fi