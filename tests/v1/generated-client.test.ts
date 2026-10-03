import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { Bctrl, BctrlError, waitFor } from '../../src/index.js';

const browser = JSON.parse(readFileSync(new URL('../fixtures/browser.json', import.meta.url), 'utf8'));

test('generated mutation retries reuse an automatic idempotency key and preserve caller keys', async () => {
  const requests: Headers[] = [];
  const client = new Bctrl({ token: 'test', fetch: async (_url, options) => {
    requests.push(new Headers(options?.headers));
    return requests.length === 1 ? Response.json({ error: { code: 'capacity.unavailable' } }, { status: 503 }) : Response.json(browser);
  } });
  const created = await client.browsers.create({ name: 'checkout' });
  assert.equal(created.id, browser.id);
  assert.ok(requests[0]?.get('Idempotency-Key'));
  assert.equal(requests[0]?.get('Idempotency-Key'), requests[1]?.get('Idempotency-Key'));
  assert.equal(requests[0]?.get('BCTRL-Version'), '2026-10-03');
  await client.browsers.create({ 'Idempotency-Key': 'caller-key' });
  assert.equal(requests[2]?.get('Idempotency-Key'), 'caller-key');
});

test('unknown error outcomes and connection loss are never retried, including per-request overrides', async () => {
  for (const outcome of ['error', 'network']) {
    let attempts = 0;
    const client = new Bctrl({ token: 'test', maxRetries: 5, fetch: async () => {
      attempts++;
      if (outcome === 'network') throw new Error('Lost acknowledgment');
      return Response.json({ error: { reasonClass: 'outcome_unknown', details: { status: 'unknown' } } }, { status: 503 });
    } });
    await assert.rejects(client.browsers.create({}, { maxRetries: 4 }), BctrlError);
    assert.equal(attempts, 1);
  }
});

test('generated pagination fetches the next cursor, retaining filters and scope', async () => {
  const requests: URL[] = [];
  const client = new Bctrl({ token: 'test', bctrlSpace: 'checkout', fetch: async (input, options) => {
    requests.push(new URL(String(input)));
    assert.equal(new Headers(options?.headers).get('BCTRL-Space'), 'checkout');
    return Response.json({ data: [{ ...browser, name: requests.length === 1 ? 'first' : 'second' }],
      nextCursor: requests.length === 1 ? 'cursor-two' : null, hasMore: requests.length === 1 });
  } });
  const names: string[] = [];
  for await (const value of await client.browsers.list({ location: 'auto', limit: 1 })) names.push(value.name);
  assert.deepEqual(names, ['first', 'second']);
  assert.equal(requests[1]?.searchParams.get('cursor'), 'cursor-two');
  assert.equal(requests[1]?.searchParams.get('location'), 'auto');
});

test('browser.connect refreshes connections and scoped helper stops after a failed callback', async () => {
  const paths: string[] = [];
  const client = new Bctrl({ token: 'test', fetch: async (input) => {
    paths.push(new URL(String(input)).pathname);
    return Response.json(browser);
  } });
  const created = await client.browsers.create();
  const connected: string[] = [];
  const result = await created.connect({ chromium: { connectOverCDP: async (url) => { connected.push(url); return 'connected'; } } });
  assert.equal(result, 'connected');
  assert.deepEqual(connected, [browser.currentRun.connections.cdpUrl]);
  await assert.rejects(client.browsers.with({}, async () => { throw new Error('work failed'); }), /work failed/);
  assert.equal(paths.at(-1), `/v1/browsers/${browser.id}/stop`);
});

test('wait helper treats unknown and awaiting_input as terminal without dispatching an effect', async () => {
  let reads = 0;
  assert.deepEqual(await waitFor(async () => { reads++; return { status: 'unknown' }; }), { status: 'unknown' });
  assert.equal(reads, 1);
  for (const status of ['cancelled', 'timed_out']) {
    assert.deepEqual(await waitFor(async () => ({ status }), { timeoutMs: 0 }), { status });
  }
  assert.deepEqual(await waitFor(async () => ({ status: 'awaiting_input' })), { status: 'awaiting_input' });
});
