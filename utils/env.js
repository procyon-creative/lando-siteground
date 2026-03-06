'use strict';

/**
 * Resolve the effective SiteGround environment for an app.
 *
 * On SiteGround, environments are subdirectories of /home/<user>/www/.
 * The env name is the directory name (e.g., "mysite.com", "staging.mysite.com").
 *
 * Precedence:
 * 1. CLI override (options.env).
 * 2. LANDO_SG_ENV environment variable.
 * 3. app.config.config.env (recipe config in .lando.yml).
 * 4. Empty string (no default — must be configured).
 */
exports.resolveEnv = (app, options = {}) => {
  if (options.env) return options.env;
  if (process.env.LANDO_SG_ENV) return process.env.LANDO_SG_ENV;

  const recipeCfg = (app.config || {}).config || {};
  if (recipeCfg.env) return recipeCfg.env;

  return '';
};

/**
 * Resolve SSH connection details for a given environment.
 *
 * SiteGround SSH defaults:
 * - Port: 18765
 * - Host: <hostname from config>
 * - User: <username from config>
 * - Path: /home/<user>/www/<env>/public_html  (derived from user + env name)
 *
 * Per-environment overrides come from config.connection[env] which should
 * be placed in .lando.local.yml (not checked in).
 */
exports.resolveConnection = (app, env) => {
  const recipeCfg = (app.config || {}).config || {};
  const connections = recipeCfg.connection || {};
  const envConnection = connections[env] || {};

  const user = recipeCfg.user || '';
  const defaultPath = (user && env) ? `/home/${user}/www/${env}/public_html` : '';

  // Resolve SSH key path. Lando mounts keys at /user/.ssh/<name>.
  // config.key should be just the key filename (e.g., "procyon").
  const keyName = recipeCfg.key || '';
  const keyPath = keyName ? `/user/.ssh/${keyName}` : '';

  const defaults = {
    host: recipeCfg.host || '',
    user,
    port: 18765,
    path: defaultPath,
    key: keyPath,
  };

  return Object.assign({}, defaults, envConnection);
};
