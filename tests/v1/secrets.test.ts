import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('secrets keep path slashes, encode segments and send If-Match', async () => {
  const requests: Array<{ method: string; path: string; body: unknown; ifMatch: string | null }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    requests.push({
      method,
      path: `${url.pathname}${url.search}`,
      body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : null,
      ifMatch: new Headers(init?.headers).get('if-match'),
    });
    const body =
      url.pathname === '/v1/secrets'
        ? { data: [{ id: 'prod/a' }], folders: ['prod/db/'], nextCursor: null }
        : url.pathname === '/v1/secrets:reveal'
          ? { id: 'prod/github/bot', version: 3, username: 'bot', password: 'p' }
          : { id: 'prod/github/bot', version: 4 };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://api.example.test', fetch: fetchMock });

  const page = await client.secrets.list({ prefix: 'prod/', delimiter: '/' });
  assert.deepEqual(page.folders, ['prod/db/']);
  await client.secrets.get('prod/github/bot');
  await client.secrets.get('prod/odd name');
  await client.secrets.put('prod/github/bot', { type: 'login', password: 'p' }, { ifMatch: 3 });
  await client.secrets.put('prod/github/bot', { fromVersion: 2 });
  await client.secrets.update('prod/github/bot', { totp: null });
  await client.secrets.delete('prod/github/bot', { ifMatch: 4 });
  const revealed = await client.secrets.reveal('prod/github/bot', { version: 3 });
  assert.equal(revealed.password, 'p');

  assert.deepEqual(
    requests.map(({ method, path, ifMatch }) => [method, path, ifMatch]),
    [
      ['GET', '/v1/secrets?prefix=prod%2F&delimiter=%2F', null],
      ['GET', '/v1/secrets/prod/github/bot', null],
      ['GET', '/v1/secrets/prod/odd%20name', null],
      ['PUT', '/v1/secrets/prod/github/bot', '"3"'],
      ['PUT', '/v1/secrets/prod/github/bot', null],
      ['PATCH', '/v1/secrets/prod/github/bot', null],
      ['DELETE', '/v1/secrets/prod/github/bot', '"4"'],
      ['POST', '/v1/secrets:reveal', null],
    ]
  );
  assert.deepEqual(requests[4]!.body, { fromVersion: 2 });
  assert.deepEqual(requests[5]!.body, { totp: null });
  assert.deepEqual(requests[7]!.body, { path: 'prod/github/bot', version: 3 });
});
