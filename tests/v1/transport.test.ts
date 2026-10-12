import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, BctrlError } from '../../src/index.js';

test('writes without an idempotency key run once even when retry attempts are configured', async () => {
  let attempts = 0;
  const client = new Bctrl({ token: 'key', maxRetries: 3, fetch: async () => {
    attempts++;
    return Response.json({ error: { code: 'upstream.unavailable', message: 'Unavailable' } }, { status: 503 });
  } });
  await assert.rejects(client.browsers.create({}), (error: BctrlError) => error.statusCode === 503);
  assert.equal(attempts, 1);
});

test('keyed writes reuse the same key and exact JSON body across a retry', async () => {
  const calls: { key: string | null; body: unknown }[] = [];
  const client = new Bctrl({ token: 'key', maxRetries: 1, fetch: async (_url, init) => {
    calls.push({ key: new Headers(init?.headers).get('Idempotency-Key'), body: init?.body });
    return calls.length === 1 ? Response.json({ error: { code: 'upstream.unavailable' } }, { status: 503 }) : Response.json({ id: 'browser' });
  } });
  await client.browsers.create({ recording: false, 'Idempotency-Key': 'create-1' });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].key, 'create-1');
});

test('unknown outcomes never retry even with an idempotency key', async () => {
  let attempts = 0;
  const client = new Bctrl({ token: 'key', maxRetries: 2, fetch: async () => {
    attempts++;
    return Response.json({ error: { reasonClass: 'outcome_unknown', code: 'future.code' } }, { status: 503 });
  } });
  await assert.rejects(client.browsers.create({ 'Idempotency-Key': 'create-1' }));
  assert.equal(attempts, 1);
});

test('aborting during a retry delay ends promptly and does not send another request', async () => {
  const controller = new AbortController();
  let attempts = 0;
  const client = new Bctrl({ token: 'key', maxRetries: 3, fetch: async () => {
    attempts++;
    setTimeout(() => controller.abort(), 10);
    return Response.json({}, { status: 429, headers: { 'retry-after': '60' } });
  } });
  const started = performance.now();
  await assert.rejects(client.spaces.list({}, { abortSignal: controller.signal }));
  assert.ok(performance.now() - started < 1000);
  assert.equal(attempts, 1);
});

test('the SDK refuses authenticated redirects at the transport boundary', async () => {
  const client = new Bctrl({ token: 'key', fetch: async (_url, init) => {
    assert.equal(init?.redirect, 'error');
    throw new TypeError('redirect refused');
  } });
  await assert.rejects(client.auth.whoami());
});

test('browser uploads use PUT multipart and preserve binary bytes and destination query', async () => {
  const bytes = new Uint8Array([0, 255, 128]);
  const client = new Bctrl({ token: 'key', fetch: async (url, init) => {
    assert.equal(init?.method, 'PUT');
    assert.equal(new URL(String(url)).pathname, '/v1/browsers/name%2Fbrowser/files/content');
    assert.equal(new URL(String(url)).searchParams.get('path'), '/workspace/input.bin');
    const request = new Request(String(url), { ...init, duplex: 'half' } as RequestInit);
    const form = await request.formData();
    const file = form.get('file') as File;
    assert.deepEqual(new Uint8Array(await file.arrayBuffer()), bytes);
    return Response.json({ ok: true });
  } });
  await client.browsers.files.upload({ browserId: 'name/browser', path: '/workspace/input.bin', file: new Blob([bytes]) });
});
