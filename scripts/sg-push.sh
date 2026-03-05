#!/bin/bash
set -eo pipefail

# SiteGround push script
# Pushes code, database, and/or files to a SiteGround environment.
#
# Environment variables (set by Lando tooling):
#   LANDO_SG_ENV       - environment name (directory under /home/<user>/www/)
#   LANDO_SG_SSH_HOST  - SSH hostname
#   LANDO_SG_SSH_USER  - SSH username
#   LANDO_SG_SSH_PORT  - SSH port (default 18765)
#   LANDO_SG_SSH_PATH  - remote webroot path (auto-derived: /home/<user>/www/<env>)
#
# Flags (passed through by Lando):
#   --code      Push code via rsync
#   --database  Push database via wp db export/import
#   --files     Push uploads via rsync
#   --message   Change description (for logging)

# Parse flags
PUSH_CODE=false
PUSH_DATABASE=false
PUSH_FILES=false
PUSH_MESSAGE="Lando push"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --code)      PUSH_CODE=true; shift ;;
    --database)  PUSH_DATABASE=true; shift ;;
    --files)     PUSH_FILES=true; shift ;;
    --message)   PUSH_MESSAGE="$2"; shift 2 ;;
    *)           shift ;;
  esac
done

# If no flags specified, show help instead of pushing everything
if [[ "$PUSH_CODE" == "false" && "$PUSH_DATABASE" == "false" && "$PUSH_FILES" == "false" ]]; then
  echo "Usage: lando push [--code] [--database] [--files]"
  echo ""
  echo "You must specify at least one of --code (-c), --database (-d), or --files (-f)."
  echo "Push does NOT default to pushing everything for safety."
  exit 1
fi

# Validate connection
if [[ -z "$LANDO_SG_SSH_HOST" || -z "$LANDO_SG_SSH_USER" ]]; then
  echo "ERROR: SiteGround SSH connection not configured."
  echo ""
  echo "Add to your .lando.yml or .lando.local.yml:"
  echo ""
  echo "  config:"
  echo "    host: your-server.siteground.biz"
  echo "    user: your-ssh-username"
  echo "    env: mysite.com"
  echo ""
  exit 1
fi

SSH_PORT="${LANDO_SG_SSH_PORT:-18765}"
SSH_CMD="ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new"
REMOTE="${LANDO_SG_SSH_USER}@${LANDO_SG_SSH_HOST}"
REMOTE_PATH="${LANDO_SG_SSH_PATH}"

echo "=== SiteGround Push ==="
echo "  Environment: ${LANDO_SG_ENV}"
echo "  Host: ${LANDO_SG_SSH_HOST}:${SSH_PORT}"
echo "  User: ${LANDO_SG_SSH_USER}"
echo "  Path: ${REMOTE_PATH}"
echo "  Message: ${PUSH_MESSAGE}"
echo ""

# Push code
if [[ "$PUSH_CODE" == "true" ]]; then
  echo "--- Pushing code ---"
  rsync -rlvz --delete \
    --exclude=wp-content/uploads \
    --exclude=wp-content/cache \
    --exclude=wp-content/upgrade \
    --exclude=.git \
    --exclude=.lando.yml \
    --exclude=.lando.local.yml \
    --exclude=wp-config.php \
    -e "${SSH_CMD}" \
    /app/ "${REMOTE}:${REMOTE_PATH}/"
  echo "Code push complete."
  echo ""
fi

# Push database
if [[ "$PUSH_DATABASE" == "true" ]]; then
  echo "--- Pushing database ---"
  DUMP_FILE="/tmp/sg-db-push-$$.sql"

  # Export local database
  wp db export "${DUMP_FILE}" --single-transaction --quick --allow-root

  # Import on remote via wp-cli over SSH
  cat "${DUMP_FILE}" | ${SSH_CMD} "${REMOTE}" \
    "cd ${REMOTE_PATH} && wp db import -"

  rm -f "${DUMP_FILE}"
  echo "Database push complete."
  echo ""
fi

# Push files (uploads)
if [[ "$PUSH_FILES" == "true" ]]; then
  echo "--- Pushing files ---"
  rsync -rlvz --delete \
    -e "${SSH_CMD}" \
    /app/wp-content/uploads/ "${REMOTE}:${REMOTE_PATH}/wp-content/uploads/"
  echo "Files push complete."
  echo ""
fi

echo "=== Push finished ==="
