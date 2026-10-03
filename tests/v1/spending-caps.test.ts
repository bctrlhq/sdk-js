import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('generated account and Space cap transports preserve USD cents, zero and explicit null', async () => {
  const calls: { method: string; path: string; body: unknown; headers: Headers }[] = [];
  const cap = { object: 'spending_cap', amount: 0, currency: 'USD', scope: 'organization', spaceId: null,
    status: 'reached', warnAtPercent: 80, usage: { amount: 1.25, currency: 'USD' },
    period: { start: '2026-10-01T00:00:00Z', end: '2026-11-01T00:00:00Z' } };
  const client = new Bctrl({ token: 'fixture', fetch: async (input, options) => {
    calls.push({ method: options?.method ?? 'GET', path: new URL(String(input)).pathname,
      body: options?.body ? JSON.parse(String(options.body)) : undefined, headers: new Headers(options?.headers) });
    return Response.json(cap);
  } });
  assert.equal((await client.account.spendingCap.get()).usage.amount, 1.25);
  await client.account.spendingCap.update({ body: { amount: 0, currency: 'USD' } });
  await client.spaces.spendingCap.get({ spaceId: 'team checkout' });
  await client.spaces.spendingCap.update({ spaceId: 'team checkout', body: { amount: null, currency: 'USD' } });
  assert.deepEqual(calls.map(({ method, path, body }) => ({ method, path, body })), [
    { method: 'GET', path: '/v1/account/spending-cap', body: undefined },
    { method: 'PATCH', path: '/v1/account/spending-cap', body: { amount: 0, currency: 'USD' } },
    { method: 'GET', path: '/v1/spaces/team%20checkout/spending-cap', body: undefined },
    { method: 'PATCH', path: '/v1/spaces/team%20checkout/spending-cap', body: { amount: null, currency: 'USD' } },
  ]);
  for (const call of calls) assert.equal(call.headers.get('BCTRL-Version'), '2026-10-03');
  for (const call of calls.filter(call => call.method === 'PATCH')) assert.ok(call.headers.get('Idempotency-Key'));
});
