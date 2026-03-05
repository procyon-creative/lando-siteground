'use strict';

const chai = require('chai');
const {expect} = chai;
const {resolveEnv, resolveConnection} = require('../utils/env');

describe('siteground plugin', () => {
  describe('resolveEnv', () => {
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
  });

  describe('resolveConnection', () => {
    it('should derive path from user and env', () => {
      const app = {config: {config: {host: 'srv.siteground.biz', user: 'u123'}}};
      const conn = resolveConnection(app, 'mysite.com');
      expect(conn.host).to.equal('srv.siteground.biz');
      expect(conn.user).to.equal('u123');
      expect(conn.port).to.equal(18765);
      expect(conn.path).to.equal('/home/u123/www/mysite.com');
    });

    it('should allow per-environment overrides', () => {
      const app = {
        config: {
          config: {
            host: 'srv.siteground.biz',
            user: 'u123',
            connection: {
              'staging.mysite.com': {path: '/home/u123/www/staging.mysite.com'},
            },
          },
        },
      };
      const conn = resolveConnection(app, 'staging.mysite.com');
      expect(conn.path).to.equal('/home/u123/www/staging.mysite.com');
      expect(conn.host).to.equal('srv.siteground.biz');
    });

    it('should return empty path when user or env is missing', () => {
      const app = {config: {config: {host: 'srv.siteground.biz'}}};
      const conn = resolveConnection(app, '');
      expect(conn.path).to.equal('');
    });
  });
});
