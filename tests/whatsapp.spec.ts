import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// features.json switches the WhatsApp community on and off for the whole site:
// the links, the join form and the gate function that hands out the invite link.
const featuresFile = path.join(__dirname, '..', 'features.json');
const { whatsapp: enabled } = JSON.parse(fs.readFileSync(featuresFile, 'utf-8'));
const { handler } = require('../netlify/functions/whatsapp-gate.js');

test.describe(`WhatsApp community ${enabled ? 'on' : 'off'}`, () => {
  for (const path of ['/', '/contact-us/']) {
    test(`${path} ${enabled ? 'links to' : 'does not link to'} the WhatsApp page`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('a[href="/whatsapp/"]');
      if (enabled) {
        await expect(links.first()).toBeAttached();
      } else {
        await expect(links).toHaveCount(0);
      }
    });
  }

  test(`/whatsapp/ ${enabled ? 'shows the join form' : 'says joining is paused'}`, async ({ page }) => {
    await page.goto('/whatsapp/');
    if (enabled) {
      await expect(page.locator('form#whatsapp-form')).toBeVisible();
      await expect(page.locator('#whatsapp-paused')).toHaveCount(0);
    } else {
      await expect(page.locator('#whatsapp-paused')).toBeVisible();
      await expect(page.locator('form#whatsapp-form')).toHaveCount(0);
      await expect(page.locator('script[src="/js/whatsapp.js"]')).toHaveCount(0);
    }
  });

  test(`the gate function ${enabled ? 'returns' : 'never returns'} the invite link`, async () => {
    const link = 'https://chat.whatsapp.com/test-invite';
    const saved = process.env.WHATSAPP_JOIN_LINK;
    process.env.WHATSAPP_JOIN_LINK = link;
    try {
      const accepted = await handler({ httpMethod: 'POST', body: 'test-accept=1' });
      if (enabled) {
        expect(accepted.statusCode).toBe(200);
        expect(JSON.parse(accepted.body)).toEqual({ link });
      } else {
        expect(accepted.statusCode).toBe(503);
        expect(accepted.body).not.toContain(link);
      }
    } finally {
      if (saved === undefined) delete process.env.WHATSAPP_JOIN_LINK;
      else process.env.WHATSAPP_JOIN_LINK = saved;
    }
  });
});
