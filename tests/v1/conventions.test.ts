import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, BctrlError, Api } from '../../src/index.js';

test('the generated transport pins its dated version and preserves the canonical error envelope', async () => {
  const envelope = { error: { code: 'auth.forbidden', message: 'Denied', hint: 'Grant the scope.', reasonClass: 'capability_denied', requestId: 'req-test', details: { scope: 'computer' }, future: true } };
  const client = new Bctrl({ token: 'test-key', maxRetries: 0, fetch: async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('BCTRL-Version'), '2026-10-03');
    return Response.json(envelope, { status: 403, headers: { 'BCTRL-Request-Id': 'req-test' } });
  } });
  await assert.rejects(client.spaces.list(), (error: unknown) => {
    assert.ok(error instanceof Api.ForbiddenError);
    assert.equal(error.statusCode, 403);
    assert.deepEqual(error.body, envelope);
    assert.equal(error.rawResponse?.headers.get('BCTRL-Request-Id'), 'req-test');
    return true;
  });
});

test('an unknown successful outcome is returned once without retrying the effect', async () => {
  let effects = 0;
  const outcome = { object: 'computer.result', status: 'unknown', data: null, eventId: 'evt-test' };
  const client = new Bctrl({ token: 'test', maxRetries: 3, fetch: async () => { effects++; return Response.json(outcome); } });
  assert.deepEqual(await client.tools.call({ toolRef: 'computer.use', body: { action: 'click', coordinate: [1, 2] } }), outcome);
  assert.equal(effects, 1);
});
