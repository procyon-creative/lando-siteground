'use strict';

const chai = require('chai');
const {expect} = chai;
const {resolveEnv, resolveConnection} = require('../utils/env');

describe('siteground plugin', () => {
  describe('resolveEnv', () => {
    afterEach(() => {
      delete process.env.LANDO_SG_ENV;
    });

    it('should default to empty string when unconfigured', () => {
      const app = {config: {}};
      expect(resolveEnv(app)).to.equal('');
    });

    it('should use recipe config env', () => {
      const app = {config: {config: {env: 'mysite.com'}}};
      expect(resolveEnv(app)).to.equal('mysite.com');
    });

    it('should prefer CLI option over config', () => {
      const app = {config: {config: {env: 'mysite.com'}}};
      expect(resolveEnv(app, {env: 'staging.mysite.com'})).to.equal('staging.mysite.com');
    });

    it('should prefer LANDO_SG_ENV env var over config', () => {
      process.env.LANDO_SG_ENV = 'from-env-var.com';
      const app = {config: {config: {env: 'from-config.com'}}};
      expect(resolveEnv(app)).to.equal('from-env-var.com');
    });

    it('should prefer CLI option over LANDO_SG_ENV', () => {
      process.env.LANDO_SG_ENV = 'from-env-var.com';
      const app = {config: {config: {env: 'from-config.com'}}};
      expect(resolveEnv(app, {env: 'from-cli.com'})).to.equal('from-cli.com');
    });

    it('should handle missing config gracefully', () => {
      expect(resolveEnv({config: null})).to.equal('');
      expect(resolveEnv({})).to.equal('');
    });
  });

  describe('resolveConnection', () => {
    it('should derive path from user and env', () => {
      const app = {config: {config: {host: 'srv.sg-host.com', user: 'u123'}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.host).to.equal('srv.sg-host.com');
      expect(conn.user).to.equal('u123');
      expect(conn.port).to.equal(18765);
      expect(conn.path).to.equal('/home/u123/www/mysite.com/public_html');
    });

    it('should allow per-environment connection overrides', () => {
      const app = {
        config: {
          config: {
            host: 'srv.sg-host.com',
            user: 'u123',
            connection: {
              'staging.mysite.com': {path: '/custom/override/path'},
            },
          },
        },
      };
      const conn = resolveConnection(app, 'staging.mysite.com');
      expect(conn.path).to.equal('/custom/override/path');
      expect(conn.host).to.equal('srv.sg-host.com');
    });

    it('should return empty path when user is missing', () => {
      const app = {config: {config: {host: 'srv.sg-host.com'}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.path).to.equal('');
    });

    it('should return empty path when env is empty', () => {
      const app = {config: {config: {host: 'srv.sg-host.com', user: 'u123'}}};
      const conn = resolveConnection(app, '');
      expect(conn.path).to.equal('');
    });

    it('should resolve SSH key path from config.key', () => {
      const app = {config: {config: {host: 'srv.sg-host.com', user: 'u123', key: 'mykey'}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.key).to.equal('/user/.ssh/mykey');
    });

    it('should return empty key when config.key not set', () => {
      const app = {config: {config: {host: 'srv.sg-host.com', user: 'u123'}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.key).to.equal('');
    });

    it('should use default port 18765', () => {
      const app = {config: {config: {}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.port).to.equal(18765);
    });

    it('should allow port override via connection', () => {
      const app = {
        config: {
          config: {
            host: 'srv.sg-host.com',
            user: 'u123',
            connection: {
              'mysite.com': {port: 22},
            },
          },
        },
      };
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.port).to.equal(22);
    });
  });
});
