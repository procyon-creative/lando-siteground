#!/bin/bash
set -eo pipefail

# Discover SiteGround environments by probing via SSH.
# Environments are subdirectories of /home/<user>/www/ on the remote server.
# Each subdirectory is a separate WordPress environment.

if [[ -z "$LANDO_SG_SSH_HOST" || -z "$LANDO_SG_SSH_USER" ]]; then
  echo "ERROR: SiteGround SSH connection not configured."
  echo ""
  echo "Add to your .lando.yml or .lando.local.yml:"
  echo ""
  echo "  config:"
  echo "    host: your-server.siteground.biz"
  echo "    user: your-ssh-username"
  exit 1
fi

SSH_PORT="${LANDO_SG_SSH_PORT:-18765}"
SSH_CMD="ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
REMOTE="${LANDO_SG_SSH_USER}@${LANDO_SG_SSH_HOST}"
CURRENT_ENV="${LANDO_SG_ENV}"
WWW_ROOT="/home/${LANDO_SG_SSH_USER}/www"

echo "SiteGround Environments"
echo "  Host: ${LANDO_SG_SSH_HOST}:${SSH_PORT}"
echo "  User: ${LANDO_SG_SSH_USER}"
echo ""

# List subdirectories under /home/<user>/www/
ENV_DIRS=$(${SSH_CMD} "${REMOTE}" \
  "ls -1d ${WWW_ROOT}/*/ 2>/dev/null | xargs -I{} basename {}" \
  2>/dev/null || true)

if [[ -n "$ENV_DIRS" ]]; then
  while IFS= read -r dir; do
    env_path="${WWW_ROOT}/${dir}"
    if [[ "$CURRENT_ENV" == "$dir" ]]; then
      echo "  * ${dir}  ${env_path}  (active)"
    else
      echo "    ${dir}  ${env_path}"
    fi
  done <<< "$ENV_DIRS"
else
  echo "  No environments found at ${WWW_ROOT}/"
fi

echo ""
