#!/bin/bash
set -eo pipefail

# Wrapper that translates lando pull flags into procyon commands.
# Lando passes booleans as --flag=true/--flag=false.

PULL_DB=false
PULL_FILES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --database|--database=true|-d) PULL_DB=true; shift ;;
    --files|--files=true|-f)       PULL_FILES=true; shift ;;
    --env=*)                       LANDO_SG_TARGET="${1#--env=}"; shift ;;
    --env)                         LANDO_SG_TARGET="$2"; shift 2 ;;
    *)                             shift ;;
  esac
done

if [[ "$PULL_DB" == "false" && "$PULL_FILES" == "false" ]]; then
  PULL_DB=true
  PULL_FILES=true
fi

TARGET="${LANDO_SG_TARGET}"
if [[ -z "$TARGET" ]]; then
  echo "ERROR: No SiteGround environment configured."
  echo "Set config.env in your .lando.yml or use --env <name>"
  exit 1
fi

if [[ "$PULL_DB" == "true" ]]; then
  echo "=== Pulling database from ${TARGET} ==="
  # Drop existing tables for a clean import (avoids prefix mismatch issues)
  echo "Resetting local database..."
  wp db reset --yes 2>/dev/null || true
  $LANDO_SG_PROCYON db pull "$TARGET"
fi

if [[ "$PULL_FILES" == "true" ]]; then
  echo "=== Pulling files from ${TARGET} ==="
  $LANDO_SG_PROCYON files pull "$TARGET" uploads
fi

echo "=== Pull complete ==="
