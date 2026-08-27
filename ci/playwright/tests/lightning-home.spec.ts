import { expect, test } from '@playwright/test';
import fs from 'node:fs';

function orgCreds() {
  const jsonPath = process.env.SF_ORG_DISPLAY_JSON;
  if (jsonPath && fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(raw.slice(raw.indexOf('{')));
    const result = parsed.result || {};
    return {
      instanceUrl: String(result.instanceUrl || ''),
      accessToken: String(result.accessToken || ''),
    };
  }
  return {
    instanceUrl: process.env.SF_INSTANCE_URL || '',
    accessToken: process.env.SF_ACCESS_TOKEN || '',
  };
}

test('Lightning home loads through frontdoor', async ({ page }) => {
  const { instanceUrl, accessToken } = orgCreds();
  test.skip(!instanceUrl || !accessToken, 'needs a scratch org (SF_ORG_DISPLAY_JSON or SF_INSTANCE_URL + SF_ACCESS_TOKEN)');

  const frontDoor = `${instanceUrl.replace(/\/$/, '')}/secur/frontdoor.jsp?sid=${accessToken}`;
  await page.goto(frontDoor, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/lightning(\/|$)/, { timeout: 60_000 });
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveURL(/\/login|\/error|\/_nc_external/i);
});
