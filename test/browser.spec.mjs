import {test, expect} from '@playwright/test';

const SITE_URL = 'https://sg-e2e-test.lndo.site';

test.describe('siteground browser tests', () => {
  test('site loads and returns 200', async ({page}) => {
    const response = await page.goto(SITE_URL);
    expect(response.status()).toBe(200);
  });

  test('site serves WordPress content', async ({page}) => {
    await page.goto(SITE_URL);
    // WordPress default install has a title and the site name
    const title = await page.title();
    expect(title).toContain('SG Test');
  });

  test('wp-login.php is accessible', async ({page}) => {
    const response = await page.goto(`${SITE_URL}/wp-login.php`);
    expect(response.status()).toBe(200);
    // Should have a login form
    await expect(page.locator('#loginform')).toBeVisible();
    await expect(page.locator('#user_login')).toBeVisible();
    await expect(page.locator('#user_pass')).toBeVisible();
  });

  test('wp-admin redirects to login when not authenticated', async ({page}) => {
    await page.goto(`${SITE_URL}/wp-admin/`);
    // Should redirect to login page
    expect(page.url()).toContain('wp-login.php');
  });

  test('admin can log in', async ({page}) => {
    await page.goto(`${SITE_URL}/wp-login.php`);
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'admin');
    await page.click('#wp-submit');
    await page.waitForURL(/wp-admin/);
    // Should be on the dashboard
    expect(page.url()).toContain('wp-admin');
    await expect(page.locator('#wpadminbar')).toBeVisible();
  });
});
