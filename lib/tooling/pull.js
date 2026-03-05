'use strict';

const {resolveEnv, resolveConnection} = require('../../utils/env');

/**
 * Define the `pull` tooling command for a SiteGround app.
 *
 * Pulls code (rsync), database (wp db export/import), and/or files (rsync)
 * from a SiteGround environment into the local Lando app.
 *
 * SiteGround SSH access is on port 18765 by default.
 */
module.exports = (app) => {
  const env = resolveEnv(app);
  const conn = resolveConnection(app, env);

  return {
    service: 'appserver',
    description: 'Pull code, database, and/or files from SiteGround',
    cmd: '/helpers/sg-pull.sh',
    level: 'app',
    stdio: ['inherit', 'pipe', 'pipe'],
    options: {
      code: {
        description: 'Pull code from the remote environment',
        passthrough: true,
        alias: ['c'],
        boolean: true,
        default: false,
      },
      database: {
        description: 'Pull database from the remote environment',
        passthrough: true,
        alias: ['d'],
        boolean: true,
        default: false,
      },
      files: {
        description: 'Pull files (uploads) from the remote environment',
        passthrough: true,
        alias: ['f'],
        boolean: true,
        default: false,
      },
      rsync: {
        description: 'Use rsync mode (good for subsequent pulls)',
        passthrough: true,
        boolean: true,
        default: true,
      },
    },
    env: {
      LANDO_SG_ENV: env,
      LANDO_SG_SSH_HOST: conn.host,
      LANDO_SG_SSH_USER: conn.user,
      LANDO_SG_SSH_PORT: String(conn.port),
      LANDO_SG_SSH_PATH: conn.path,
    },
  };
};
