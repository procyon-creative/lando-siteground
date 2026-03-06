'use strict';

const {execSync} = require('child_process');
const {expect} = require('chai');
const path = require('path');

const E2E_DIR = path.join(__dirname, 'e2e-project');
const LANDO_OPTS = {cwd: E2E_DIR, encoding: 'utf8', timeout: 120000};

const lando = (cmd) => {
  try {
    return {stdout: execSync(`lando ${cmd}`, LANDO_OPTS).trim(), code: 0};
  } catch (err) {
    return {stdout: (err.stdout || '').trim(), stderr: (err.stderr || '').trim(), code: err.status};
  }
};

// lando info --format json may have non-JSON lines (e.g., from other plugins logging).
// Strip everything before the first [{ to find the JSON array.
const parseLandoInfo = () => {
  const result = lando('info --format json');
  expect(result.code).to.equal(0);
  const raw = result.stdout;
  const jsonStart = raw.indexOf('[{');
  expect(jsonStart).to.be.at.least(0, 'No JSON array found in lando info output');
  return JSON.parse(raw.slice(jsonStart));
};

describe('siteground e2e', function () {
  this.timeout(300000);

  describe('recipe and services', () => {
    it('should have appserver and database services running', () => {
      const info = parseLandoInfo();
      const services = info.map(s => s.service);
      expect(services).to.include('appserver');
      expect(services).to.include('database');
    });

    it('should use PHP 8.3', () => {
      const result = lando('php -v');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.match(/PHP 8\.3/);
    });

    it('should have wp-cli available', () => {
      const result = lando('wp --version');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.match(/WP-CLI/);
    });

    it('should have a working WordPress installation', () => {
      const result = lando('wp option get siteurl');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('sg-e2e-test.lndo.site');
    });

    it('should have a working database connection', () => {
      const result = lando('wp db query "SELECT 1 AS ok"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('ok');
    });
  });

  describe('procyon integration', () => {
    it('should have node available in the container', () => {
      const result = lando('ssh -c "node --version"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.match(/v\d+/);
    });

    it('should mount procyon-cli into the container', () => {
      const result = lando('ssh -c "test -f /helpers/procyon/index.js && echo ok"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('ok');
    });

    it('should have a valid .procyon link', () => {
      const result = lando('ssh -c "cat /app/.procyon"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('project');
    });

    it('should run procyon commands', () => {
      const result = lando('procyon --help');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('procyon');
      expect(result.stdout).to.include('db');
      expect(result.stdout).to.include('files');
    });

    it('should mount sg-env-list.sh as executable', () => {
      const result = lando('ssh -c "test -x /helpers/sg-env-list.sh && echo ok"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('ok');
    });

    it('should mount wrapper scripts as readable', () => {
      const result = lando('ssh -c "test -f /helpers/sg-pull-wrapper.sh && test -f /helpers/sg-push-wrapper.sh && echo ok"');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('ok');
    });
  });

  describe('pull command', () => {
    it('should register with correct description', () => {
      const result = lando('pull --help');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('Pull database and/or files from SiteGround');
    });

    it('should have --database, --files, --env flags', () => {
      const result = lando('pull --help');
      expect(result.stdout).to.include('--database');
      expect(result.stdout).to.include('--files');
      expect(result.stdout).to.include('--env');
      expect(result.stdout).to.include('-d');
      expect(result.stdout).to.include('-f');
    });

    it('should show configured env name in output', () => {
      const result = lando('pull -d');
      expect(result.code).to.not.equal(0);
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('test-site.com');
    });

    it('should only attempt db pull when -d is specified', () => {
      const result = lando('pull -d');
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('Pulling database');
      expect(output).to.not.include('Pulling files');
    });

    it('should only attempt files pull when -f is specified', () => {
      const result = lando('pull -f');
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('Pulling files');
      expect(output).to.not.include('Pulling database');
    });

    // pull -d triggers wp db reset, so reinstall WP for subsequent tests
    after(() => {
      lando('wp core install --url=https://sg-e2e-test.lndo.site --title="SG Test" --admin_user=admin --admin_password=admin --admin_email=admin@test.com');
    });
  });

  describe('push command', () => {
    it('should register with correct description', () => {
      const result = lando('push --help');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('Push database and/or files to SiteGround');
    });

    it('should have --database, --files flags', () => {
      const result = lando('push --help');
      expect(result.stdout).to.include('--database');
      expect(result.stdout).to.include('--files');
    });

    it('should require at least one flag (no default push-all)', () => {
      const result = lando('push');
      expect(result.code).to.not.equal(0);
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('You must specify at least one');
    });

    it('should only attempt db push when -d is specified', () => {
      const result = lando('push -d');
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('Pushing database');
      expect(output).to.not.include('Pushing files');
    });
  });

  describe('sg:env:set command', () => {
    it('should exit 0 and show LANDO_SG_ENV instructions', () => {
      const result = lando('sg:env:set');
      expect(result.code).to.equal(0);
      expect(result.stdout).to.include('LANDO_SG_ENV');
      expect(result.stdout).to.include('lando sg:env:list');
    });
  });

  describe('sg:env:list command', () => {
    it('should run the env discovery script', () => {
      const result = lando('sg:env:list');
      const output = result.stdout + (result.stderr || '');
      expect(output).to.include('SiteGround Environments');
      expect(output).to.include('Host:');
      expect(output).to.include('User:');
    });
  });

  describe('database credentials', () => {
    it('should use siteground as database name and user', () => {
      const info = parseLandoInfo();
      const db = info.find(s => s.service === 'database');
      expect(db).to.exist;
      expect(db.creds.database).to.equal('siteground');
      expect(db.creds.user).to.equal('siteground');
      expect(db.creds.password).to.equal('siteground');
    });
  });
});
