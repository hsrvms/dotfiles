#!/usr/bin/env bash
# Reads a single key from ~/.pi/agent/.env and prints its value (no trailing newline).
# Usage: get-secret.sh KEY_NAME
set -euo pipefail

file="$HOME/.pi/agent/.env"
[ -f "$file" ] || { echo "missing $file" >&2; exit 1; }

key="${1:?key name required}"

# Source the .env in a subshell (with export) so values become available,
# then print the requested variable. Quote-safe; no command execution from .env.
value="$(
  set -a
  # shellcheck disable=SC1090
  . "$file"
  set +a
  printf '%s' "${!key:-}"
)"
[ -n "$value" ] || { echo "key '$key' empty or not found in $file" >&2; exit 1; }
printf '%s' "$value"
