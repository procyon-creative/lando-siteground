'use strict';

const {resolveEnv, resolveConnection} = require('../../utils/env');

/**
 * Tooling for SiteGround environment helpers.
 *
 * `list` probes the remote server via SSH to discover staging environments.
 * `set` prints instructions for changing the active environment.
 */
module.exports = {
  list(app) {
    const env = resolveEnv(app);
    const conn = resolveConnection(app, env);

    return {
      service: 'appserver',
      description: 'Discover and list SiteGround environments via SSH',
      cmd: '/helpers/sg-env-list.sh',
      level: 'app',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: {
        LANDO_SG_ENV: env,
        LANDO_SG_SSH_HOST: conn.host,
        LANDO_SG_SSH_USER: conn.user,
        LANDO_SG_SSH_PORT: String(conn.port),
        LANDO_SG_SSH_PATH: conn.path,
        LANDO_SG_SSH_KEY: conn.key || '',
      },
    };
  },

  set() {
    return {
      service: 'appserver',
      description: 'Show instructions for setting the active SiteGround environment',
      cmd: [
        'echo "To target a specific SiteGround environment, set one of:"',
        'echo ""',
        'echo "  export LANDO_SG_ENV=<env-name>"',
        'echo ""',
        'echo "or add to your .lando.yml under the siteground recipe config:"',
        'echo ""',
        'echo "  config:"',
        'echo "    env: <env-name>"',
        'echo ""',
        'echo "Use \'lando sg:env:list\' to discover available environments."',
      ].join(' && '),
    };
  },
};
