'use strict';

const path = require('path');
const fs = require('fs');
const {resolveEnv} = require('../utils/env');
const envTooling = require('../lib/tooling/env');

const PROCYON_MOUNT = '/helpers/procyon';

/**
 * Build a procyon project config from Lando recipe config.
 * Written to a tmp file and mounted into the container.
 */
function buildProcyonConfig(app) {
  const recipeCfg = (app.config || {}).config || {};
  const env = resolveEnv(app);
  const host = recipeCfg.host || '';
  const user = recipeCfg.user || '';
  const port = recipeCfg.port || 18765;
  const keyName = recipeCfg.key || '';
  const identityFile = keyName ? `/user/.ssh/${keyName}` : '';
  const domain = recipeCfg.domain || env || '';

  const environments = {};
  // Build environment entries from connection overrides if available
  const connections = recipeCfg.connection || {};
  for (const [envName, conn] of Object.entries(connections)) {
    environments[envName] = {
      host: conn.host || host,
      user: conn.user || user,
      port: conn.port || port,
      path: conn.path || (user && envName ? `/home/${user}/www/${envName}/public_html` : ''),
      domain: conn.domain || envName,
      identityFile: conn.key ? `/user/.ssh/${conn.key}` : identityFile,
    };
  }

  // Ensure the current env has an entry
  if (env && !environments[env]) {
    environments[env] = {
      host,
      user,
      port,
      path: (user && env) ? `/home/${user}/www/${env}/public_html` : '',
      domain,
      identityFile,
    };
  }

  return {
    name: app.name || 'lando-sg',
    localPath: '/app',
    localDomain: `${app.name || 'lando-sg'}.lndo.site`,
    wpCli: 'wp',
    environments,
  };
}

/**
 * Write procyon config files to a temp dir so they can be mounted.
 */
function writeProcyonConfigFiles(app) {
  const config = buildProcyonConfig(app);
  const tmpDir = path.join(require('os').tmpdir(), `lando-sg-${app.name || 'default'}`);
  const projectsDir = path.join(tmpDir, 'projects');

  fs.mkdirSync(projectsDir, {recursive: true});
  fs.writeFileSync(
    path.join(projectsDir, `${config.name}.json`),
    JSON.stringify(config, null, 2),
  );
  fs.writeFileSync(
    path.join(tmpDir, 'link'),
    JSON.stringify({project: config.name}, null, 2),
  );

  return {tmpDir, projectsDir, projectName: config.name};
}

module.exports = {
  name: 'siteground',
  parent: 'wordpress',
  config: {},
  builder: (Parent, config) => class LandoSiteGround extends Parent {
    constructor(id, options = {}) {
      const merged = options || config || {};
      const app = merged._app;

      // Resolve procyon-cli path
      let procyonDir;
      try {
        procyonDir = path.dirname(require.resolve('procyon-cli/package.json'));
      } catch (e) {
        procyonDir = path.resolve(__dirname, '..', 'node_modules', 'procyon-cli');
      }

      // Set up volumes
      merged.services = merged.services || {};
      merged.services.appserver = merged.services.appserver || {};
      merged.services.appserver.overrides = merged.services.appserver.overrides || {};
      merged.services.appserver.overrides.volumes = merged.services.appserver.overrides.volumes || [];

      const scriptsDir = path.resolve(__dirname, '..', 'scripts');
      merged.services.appserver.overrides.volumes.push(
        `${scriptsDir}/sg-env-list.sh:/helpers/sg-env-list.sh`,
        `${scriptsDir}/sg-pull-wrapper.sh:/helpers/sg-pull-wrapper.sh`,
        `${scriptsDir}/sg-push-wrapper.sh:/helpers/sg-push-wrapper.sh`,
        `${procyonDir}:${PROCYON_MOUNT}`,
      );

      // Build steps: install node
      merged.services.appserver.build_as_root = merged.services.appserver.build_as_root || [];
      if (typeof merged.services.appserver.build_as_root === 'string') {
        merged.services.appserver.build_as_root = [merged.services.appserver.build_as_root];
      }
      merged.services.appserver.build_as_root.push(
        'apt-get update -qq && apt-get install -y -qq nodejs > /dev/null 2>&1',
      );

      if (app) {
        // Write procyon config and mount it
        const pcfg = writeProcyonConfigFiles(app);
        merged.services.appserver.overrides.volumes.push(
          `${pcfg.projectsDir}:/var/www/.procyon/projects`,
          `${pcfg.tmpDir}/link:/app/.procyon`,
        );

        merged.tooling = merged.tooling || {};

        const env = resolveEnv(app);
        const procyon = `node ${PROCYON_MOUNT}/index.js`;

        const envOption = {
          description: 'Target environment (overrides config.env)',
          passthrough: true,
          string: true,
          default: env,
        };

        merged.tooling.pull = {
          service: 'appserver',
          description: 'Pull database and/or files from SiteGround',
          cmd: '/helpers/sg-pull-wrapper.sh',
          level: 'app',
          env: {LANDO_SG_PROCYON: procyon, LANDO_SG_TARGET: env},
          options: {
            database: {
              description: 'Pull the database',
              alias: ['d'],
              boolean: true,
              default: false,
              passthrough: true,
            },
            files: {
              description: 'Pull files (uploads)',
              alias: ['f'],
              boolean: true,
              default: false,
              passthrough: true,
            },
            env: envOption,
          },
        };

        merged.tooling.push = {
          service: 'appserver',
          description: 'Push database and/or files to SiteGround',
          cmd: '/helpers/sg-push-wrapper.sh',
          level: 'app',
          env: {LANDO_SG_PROCYON: procyon, LANDO_SG_TARGET: env},
          options: {
            database: {
              description: 'Push the database',
              alias: ['d'],
              boolean: true,
              default: false,
              passthrough: true,
            },
            files: {
              description: 'Push files (uploads)',
              alias: ['f'],
              boolean: true,
              default: false,
              passthrough: true,
            },
            env: envOption,
          },
        };

        merged.tooling['sg:env:list'] = envTooling.list(app);
        merged.tooling['sg:env:set'] = envTooling.set();

        merged.tooling.procyon = {
          service: 'appserver',
          description: 'Run procyon commands directly',
          cmd: procyon,
          level: 'app',
        };
      }

      super(id, merged);
    }
  },
};
