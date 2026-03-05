#!/bin/bash
set -eo pipefail

# SiteGround pull script
# Pulls code, database, and/or files from a SiteGround environment.
#
# Environment variables (set by Lando tooling):
#   LANDO_SG_ENV       - environment name (directory under /home/<user>/www/)
#   LANDO_SG_SSH_HOST  - SSH hostname
#   LANDO_SG_SSH_USER  - SSH username
#   LANDO_SG_SSH_PORT  - SSH port (default 18765)
#   LANDO_SG_SSH_PATH  - remote webroot path (auto-derived: /home/<user>/www/<env>)
#
# Flags (passed through by Lando):
#   --code      Pull code via rsync
#   --database  Pull database via wp db export/import
#   --files     Pull uploads via rsync
#   --rsync     Use rsync (default true)

# Parse flags
PULL_CODE=false
PULL_DATABASE=false
PULL_FILES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --code)     PULL_CODE=true; shift ;;
    --database) PULL_DATABASE=true; shift ;;
    --files)    PULL_FILES=true; shift ;;
    --rsync)    shift ;; # rsync is always used, flag kept for compat
    *)          shift ;;
  esac
done

# If no flags specified, pull everything
if [[ "$PULL_CODE" == "false" && "$PULL_DATABASE" == "false" && "$PULL_FILES" == "false" ]]; then
  PULL_CODE=true
  PULL_DATABASE=true
  PULL_FILES=true
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

echo "=== SiteGround Pull ==="
echo "  Environment: ${LANDO_SG_ENV}"
echo "  Host: ${LANDO_SG_SSH_HOST}:${SSH_PORT}"
echo "  User: ${LANDO_SG_SSH_USER}"
echo "  Path: ${REMOTE_PATH}"
echo ""

# Pull code
if [[ "$PULL_CODE" == "true" ]]; then
  echo "--- Pulling code ---"
  rsync -rlvz --delete \
    --exclude=wp-content/uploads \
    --exclude=wp-content/cache \
    --exclude=wp-content/upgrade \
    --exclude=.git \
    --exclude=.lando.yml \
    --exclude=.lando.local.yml \
    --exclude=wp-config.php \
    -e "${SSH_CMD}" \
    "${REMOTE}:${REMOTE_PATH}/" /app/
  echo "Code pull complete."
  echo ""
fi

# Pull database
if [[ "$PULL_DATABASE" == "true" ]]; then
  echo "--- Pulling database ---"
  DUMP_FILE="/tmp/sg-db-pull-$$.sql"

  # Export from remote via wp-cli over SSH
  ${SSH_CMD} "${REMOTE}" \
    "cd ${REMOTE_PATH} && wp db export --single-transaction --quick -" \
    > "${DUMP_FILE}"

  # Import locally
  wp db import "${DUMP_FILE}" --allow-root
  rm -f "${DUMP_FILE}"

  echo "Database pull complete."
  echo ""
fi

# Pull files (uploads)
if [[ "$PULL_FILES" == "true" ]]; then
  echo "--- Pulling files ---"
  rsync -rlvz --delete \
    -e "${SSH_CMD}" \
    "${REMOTE}:${REMOTE_PATH}/wp-content/uploads/" /app/wp-content/uploads/
  echo "Files pull complete."
  echo ""
fi

echo "=== Pull finished ==="
