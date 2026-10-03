import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('secrets use stable IDs, preserve path metadata and send optimistic version headers', async () => {
  const secret = 'sec_u1234567890123456789012';
  const requests: Array<{ method: string; path: string; body: unknown; ifMatch: string | null }> = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (input, init) => {
    const url = new URL(String(input));
    requests.push({ method: init?.method ?? 'GET', path: url.pathname + url.search, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null, ifMatch: new Headers(init?.headers).get('If-Match') });
    return Response.json(url.pathname === '/v1/secrets' && init?.method === 'GET'
      ? { data: [{ id: secret, path: 'prod/github/bot' }], folders: ['prod/db/'], nextCursor: null }
      : url.pathname.endsWith('/versions') ? { data: [{ version: 3 }], nextCursor: null }
      : { id: secret, path: 'prod/github/bot', version: 4, username: 'bot', password: 'p' });
  } });
  const page = await client.secrets.list({ prefix: 'prod/', delimiter: '/' });
  assert.deepEqual(page.response.folders, ['prod/db/']);
  await client.secrets.create({ path: 'prod/github/bot', type: 'login', password: 'p' });
  await client.secrets.get({ secret });
  await client.secrets.update({ secret, password: 'p', 'If-Match': '"3"' });
  await client.secrets.update({ secret, fromVersion: 2 });
  await client.secrets.update({ secret, totp: null });
  await client.secrets.delete({ secret, 'If-Match': '"4"' });
  assert.equal((await client.secrets.reveal({ secret, version: 3 })).password, 'p');
  await client.secrets.versions({ secret, limit: 5 });
  assert.deepEqual(requests.map(({ method, path, ifMatch }) => [method, path, ifMatch]), [
    ['GET', '/v1/secrets?prefix=prod%2F&delimiter=%2F', null],
    ['POST', '/v1/secrets', null],
    ['GET', '/v1/secrets/' + secret, null],
    ['PATCH', '/v1/secrets/' + secret, '"3"'],
    ['PATCH', '/v1/secrets/' + secret, null],
    ['PATCH', '/v1/secrets/' + secret, null],
    ['DELETE', '/v1/secrets/' + secret, '"4"'],
    ['POST', '/v1/secrets/' + secret + '/reveal', null],
    ['GET', '/v1/secrets/' + secret + '/versions?limit=5', null],
  ]);
  assert.deepEqual(requests[1]!.body, { path: 'prod/github/bot', type: 'login', password: 'p' });
  assert.deepEqual(requests[4]!.body, { fromVersion: 2 });
  assert.deepEqual(requests[5]!.body, { totp: null });
  assert.deepEqual(requests[7]!.body, { version: 3 });
});
