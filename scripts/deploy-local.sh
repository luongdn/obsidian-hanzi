#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <path-to-vault-plugins-folder>"
  exit 1
fi

PLUGINS_DIR="$1"
DEST="$PLUGINS_DIR/obsidian-hanzi"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

mkdir -p "$DEST"

cp -f "$ROOT/main.js" "$DEST/"
cp -f "$ROOT/manifest.json" "$DEST/"
cp -f "$ROOT/styles.css" "$DEST/"

if [[ -d "$ROOT/assets" ]]; then
  cp -rf "$ROOT/assets" "$DEST/"
fi

echo "Copied to $DEST"
