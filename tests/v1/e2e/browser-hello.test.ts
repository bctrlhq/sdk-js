import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { Bctrl } from '../../../src/index.js';

const live = process.env.BCTRL_E2E === '1' && Boolean(process.env.BCTRL_API_KEY);
type ConnectedBrowser = { contexts(): Context[]; close(): Promise<void> };
type Context = {
  pages(): Page[]; newPage(): Promise<Page>;
  addCookies(cookies: { name: string; value: string; domain: string; path: string; secure: boolean; expires: number }[]): Promise<void>;
  cookies(url: string): Promise<{ name: string; value: string }[]>;
};
type Page = { goto(url: string): Promise<unknown>; title(): Promise<string>; screenshot(): Promise<Buffer> };

// Playwright is supplied by the application or the dev-stack test checkout.
const require = createRequire(import.meta.url);

test('generated SDK hello world connects, screenshots and restarts by ID with cookies preserved',
  { skip: live ? false : 'set BCTRL_E2E=1 and BCTRL_API_KEY', timeout: 300_000 }, async () => {
    const playwright = require(process.env.BCTRL_PLAYWRIGHT_PATH ?? 'playwright-core') as {
      chromium: { connectOverCDP(url: string): Promise<ConnectedBrowser> };
    };
    const client = new Bctrl({ token: process.env.BCTRL_API_KEY!,
      baseUrl: process.env.BCTRL_API_BASE_URL?.replace(/\/v1\/?$/, '') });
    const resource = await client.browsers.create({ name: `sdk-ts-hello-${Date.now()}`, location: 'auto', wait: 60 });
    let connected: ConnectedBrowser | undefined;
    try {
      connected = await resource.connect(playwright);
      const context = connected.contexts()[0]!;
      const page = context.pages()[0] ?? await context.newPage();
      await page.goto('https://example.com');
      assert.match(await page.title(), /example domain/i);
      await context.addCookies([{ name: 'bctrl_sdk_hello', value: resource.id, domain: '.example.com', path: '/',
        secure: true, expires: Date.now() / 1000 + 86400 }]);
      const image = await page.screenshot();
      assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      assert.ok(image.length > 1000);
      const firstRun = (await client.browsers.get({ browserId: resource.id })).currentRun!.id;
      await connected.close(); connected = undefined;
      await client.browsers.stop({ browserId: resource.id, wait: 60 });
      await client.browsers.start({ browserId: resource.id, wait: 60 });
      const restarted = await client.browsers.get({ browserId: resource.id });
      assert.equal(restarted.id, resource.id);
      assert.notEqual(restarted.currentRun!.id, firstRun);
      connected = await restarted.connect(playwright);
      assert.ok((await connected.contexts()[0]!.cookies('https://example.com'))
        .some((cookie) => cookie.name === 'bctrl_sdk_hello' && cookie.value === resource.id));
    } finally {
      try { await connected?.close(); }
      finally {
        try { await client.browsers.stop({ browserId: resource.id, wait: 60 }); }
        finally { await client.browsers.delete({ browserId: resource.id }); }
      }
    }
  });
