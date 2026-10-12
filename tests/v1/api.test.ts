import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { Bctrl, BctrlError } from '../../src/index.js';
import { Bctrl as ApiBctrl } from '../../src/api.js';

test('current API sends scoped authenticated requests and follows pagination', async () => {
  assert.equal(Bctrl, ApiBctrl);
  const requests: { path: string; headers: Record<string, string | string[] | undefined> }[] = [];
  const server = createServer((req, res) => {
    requests.push({ path: req.url!, headers: req.headers });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ data: [], hasMore: requests.length === 1, nextCursor: requests.length === 1 ? 'page/2' : null }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as { port: number };
    const client = new Bctrl({ token: 'test-key', baseUrl: `http://127.0.0.1:${address.port}`, bctrlSubaccountId: 'sub_test', maxRetries: 0 });
    const page = await client.spaces.list({ limit: 2 });
    assert.deepEqual(page.data, []);
    await page.getNextPage();
    assert.equal(requests.length, 2);
    assert.equal(new URL(requests[0].path, 'http://local').pathname, '/v1/spaces');
    assert.equal(new URL(requests[0].path, 'http://local').searchParams.get('limit'), '2');
    assert.equal(new URL(requests[1].path, 'http://local').searchParams.get('cursor'), 'page/2');
    assert.equal(requests[0].headers.authorization, 'Bearer test-key');
    assert.equal(requests[0].headers['bctrl-version'], '2026-10-03');
    assert.equal(requests[0].headers['bctrl-subaccount-id'], 'sub_test');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('current API encodes browser selectors and preserves future permission errors', async () => {
  let requests = 0;
  const body = { error: { code: 'future.permission_denied', message: 'Denied' } };
  const client = new Bctrl({ token: 'test-key', baseUrl: 'https://api.invalid', maxRetries: 0, fetch: async (input) => {
    requests++;
    assert.equal(new URL(String(input)).pathname, '/v1/browsers/br_a%2Fb');
    return new Response(JSON.stringify(body), { status: 403, headers: { 'content-type': 'application/json' } });
  } });
  await assert.rejects(client.browsers.get({ browserId: 'br_a/b' }), (error: unknown) => {
    assert.ok(error instanceof BctrlError);
    assert.equal(error.statusCode, 403);
    assert.deepEqual(error.body, body);
    return true;
  });
  assert.equal(requests, 1);
});
