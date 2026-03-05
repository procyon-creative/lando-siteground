'use strict';

const {resolveEnv, resolveConnection} = require('../../utils/env');

/**
 * Define the `push` tooling command for a SiteGround app.
 *
 * Pushes code (rsync), database (wp db export/import), and/or files (rsync)
 * from the local Lando app to a SiteGround environment.
 */
module.exports = (app) => {
  const env = resolveEnv(app);
  const conn = resolveConnection(app, env);

  return {
    service: 'appserver',
    description: 'Push code, database, and/or files to SiteGround',
    cmd: '/helpers/sg-push.sh',
    level: 'app',
    stdio: ['inherit', 'pipe', 'pipe'],
    options: {
      code: {
        description: 'Push code to the remote environment',
        passthrough: true,
        alias: ['c'],
        boolean: true,
        default: false,
      },
      database: {
        description: 'Push database to the remote environment',
        passthrough: true,
        alias: ['d'],
        boolean: true,
        default: false,
      },
      files: {
        description: 'Push files (uploads) to the remote environment',
        passthrough: true,
        alias: ['f'],
        boolean: true,
        default: false,
      },
      message: {
        description: 'A message describing your change (for logging)',
        passthrough: true,
        alias: ['m'],
        string: true,
        default: 'Lando push',
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
