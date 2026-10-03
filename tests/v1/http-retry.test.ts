import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('generated GET retries transient responses while retaining its query', async () => {
  const urls: string[] = [];
  const client = new Bctrl({ token: 'test', fetch: async input => {
    urls.push(String(input));
    return Response.json(urls.length === 1 ? { error: { code: 'capacity.unavailable' } } : { data: [], nextCursor: null }, { status: urls.length === 1 ? 503 : 200 });
  } });
  const page = await client.browsers.list({ limit: 7, location: 'auto' });
  assert.deepEqual(page.data, []);
  assert.equal(urls.length, 2);
  assert.equal(urls[0], urls[1]);
  assert.equal(new URL(urls[1]!).searchParams.get('limit'), '7');
});
