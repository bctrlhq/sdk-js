import assert from 'node:assert/strict';
import test from 'node:test';
import { V1HttpClient } from '../../src/http.js';
import { BctrlPermissionError } from '../../src/errors.js';

test('the transport pins its dated version and preserves canonical error context', async () => {
  const http = new V1HttpClient({ apiKey: 'test-key', maxRetries: 0, fetch: async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('BCTRL-Version'), '2026-10-01');
    return Response.json({ error: {
      code: 'auth.forbidden', message: 'Denied', hint: 'Grant the scope.',
      reasonClass: 'capability_denied', requestId: 'req-test', details: { scope: 'computer' },
      future: true,
    } }, { status: 403, headers: { 'BCTRL-Request-Id': 'req-test' } });
  } });
  await assert.rejects(http.request('/spaces'), (error: unknown) => {
    assert.ok(error instanceof BctrlPermissionError);
    assert.equal(error.message, 'Denied');
    assert.equal(error.code, 'auth.forbidden');
    assert.equal(error.requestId, 'req-test');
    assert.equal(error.hint, 'Grant the scope.');
    assert.equal(error.reasonClass, 'capability_denied');
    assert.deepEqual(error.details, { scope: 'computer' });
    return true;
  });
});

test('an unknown effect outcome is returned once without automatic retry', async () => {
  let effects = 0;
  const http = new V1HttpClient({ apiKey: 'test-key', maxRetries: 3, fetch: async () => {
    effects++;
    return Response.json({ object: 'computer.result', status: 'unknown', data: null, eventId: 'evt-test' });
  } });
  const result = await http.request<{ status: string }>('/browsers/br-test/computer/click', {
    method: 'POST', body: { x: 1, y: 2 }, headers: { 'Idempotency-Key': 'effect-test' },
  });
  assert.equal(result.status, 'unknown');
  assert.equal(effects, 1);
});
