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
      },
    };
  },

  set() {
    const msg = [
      'To target a specific SiteGround environment, set one of:',
      '',
      '  export LANDO_SG_ENV=staging/1',
      '',
      'or add to your .lando.yml under the siteground recipe config:',
      '',
      '  config:',
      '    env: staging/1',
      '',
      'Use "lando sg:env:list" to discover available environments.',
    ].join('\\n');

    return {
      service: 'appserver',
      description: 'Show instructions for setting the active SiteGround environment',
      cmd: `printf '%s\\n' "${msg}"`,
    };
  },
};
