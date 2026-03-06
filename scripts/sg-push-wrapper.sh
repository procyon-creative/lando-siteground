#!/bin/bash
set -eo pipefail

# Wrapper that translates lando push flags into procyon commands.

PUSH_DB=false
PUSH_FILES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --database|--database=true|-d) PUSH_DB=true; shift ;;
    --files|--files=true|-f)       PUSH_FILES=true; shift ;;
    --env=*)                       LANDO_SG_TARGET="${1#--env=}"; shift ;;
    --env)                         LANDO_SG_TARGET="$2"; shift 2 ;;
    *)                             shift ;;
  esac
done

if [[ "$PUSH_DB" == "false" && "$PUSH_FILES" == "false" ]]; then
  echo "You must specify at least one of: --database (-d), --files (-f)"
  exit 1
fi

TARGET="${LANDO_SG_TARGET}"
if [[ -z "$TARGET" ]]; then
  echo "ERROR: No SiteGround environment configured."
  echo "Set config.env in your .lando.yml or use --env <name>"
  exit 1
fi

if [[ "$PUSH_DB" == "true" ]]; then
  echo "=== Pushing database to ${TARGET} ==="
  $LANDO_SG_PROCYON db push "$TARGET" -y
fi

if [[ "$PUSH_FILES" == "true" ]]; then
  echo "=== Pushing files to ${TARGET} ==="
  $LANDO_SG_PROCYON files push "$TARGET" uploads --force
fi

echo "=== Push complete ==="
