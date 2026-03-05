'use strict';

const definePullTooling = require('../lib/tooling/pull');
const definePushTooling = require('../lib/tooling/push');
const envTooling = require('../lib/tooling/env');

/**
 * SiteGround recipe that extends the core WordPress recipe.
 *
 * Adds SiteGround-specific tooling: pull, push, and environment helpers.
 * SSH connection to SiteGround uses port 18765 by default.
 */
module.exports = {
  name: 'siteground',
  parent: 'wordpress',
  config: {},
  builder: (Parent, config) => class LandoSiteGround extends Parent {
    constructor(id, options = {}) {
      const merged = options || config || {};
      const app = merged._app;

      if (app) {
        merged.tooling = merged.tooling || {};
        merged.tooling.pull = definePullTooling(app);
        merged.tooling.push = definePushTooling(app);
        merged.tooling['sg:env:list'] = envTooling.list(app);
        merged.tooling['sg:env:set'] = envTooling.set();
      }

      // Mount helper scripts into the appserver container.
      merged.services = merged.services || {};
      merged.services.appserver = merged.services.appserver || {};
      merged.services.appserver.overrides = merged.services.appserver.overrides || {};
      merged.services.appserver.overrides.volumes = merged.services.appserver.overrides.volumes || [];

      const path = require('path');
      const scriptsDir = path.resolve(__dirname, '..', 'scripts');
      merged.services.appserver.overrides.volumes.push(
        `${scriptsDir}/sg-pull.sh:/helpers/sg-pull.sh`,
        `${scriptsDir}/sg-push.sh:/helpers/sg-push.sh`,
        `${scriptsDir}/sg-env-list.sh:/helpers/sg-env-list.sh`,
      );

      super(id, merged);
    }
  },
};
