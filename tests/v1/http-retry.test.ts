import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BctrlApiError } from '../../src/index.js';
import { V1HttpClient } from '../../src/http.js';

test('http retries only safe requests or idempotent unsafe requests', async () => {
  let getAttempts = 0;
  const getClient = new V1HttpClient({
    apiKey: 'test_key',
    baseUrl: 'https://api.example.test',
    fetch: async () => {
      getAttempts += 1;
      return jsonResponse(getAttempts === 1 ? 503 : 200, { ok: true });
    },
  });
  assert.deepEqual(await getClient.request('/retry-safe'), { ok: true });
  assert.equal(getAttempts, 2);

  let unsafeAttempts = 0;
  const unsafeClient = new V1HttpClient({
    apiKey: 'test_key',
    baseUrl: 'https://api.example.test',
    fetch: async () => {
      unsafeAttempts += 1;
      return jsonResponse(503, { error: 'temporarily unavailable' });
    },
  });
  await assert.rejects(
    () => unsafeClient.request('/spaces', { method: 'POST', body: { name: 'retry' } }),
    (error) => {
      assert(error instanceof BctrlApiError);
      assert.equal(error.status, 503);
      return true;
    }
  );
  assert.equal(unsafeAttempts, 1);

  let idempotentAttempts = 0;
  const idempotentClient = new V1HttpClient({
    apiKey: 'test_key',
    baseUrl: 'https://api.example.test',
    fetch: async () => {
      idempotentAttempts += 1;
      return jsonResponse(idempotentAttempts === 1 ? 503 : 200, { ok: true });
    },
  });
  assert.deepEqual(
    await idempotentClient.request('/runtimes/runtime_1/start', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'start-1' },
    }),
    { ok: true }
  );
  assert.equal(idempotentAttempts, 2);
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'retry-after': '0',
    },
  });
}
