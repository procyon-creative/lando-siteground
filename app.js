'use strict';

/**
 * App-level hooks for the Lando SiteGround plugin.
 *
 * Invoked once per Lando app. We only attach behavior for apps
 * that use the `siteground` recipe.
 */
module.exports = (app, lando) => { // eslint-disable-line no-unused-vars
  if (!app || !app.config) return;
  if (app.config.recipe !== 'siteground') return;
};
