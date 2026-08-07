import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('the SDK exposes only the canonical automation resources and routes', async () => {
  const requests: Array<{ method: string; path: string; body: unknown; headers: Headers }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : init?.body ?? null;
    requests.push({
      method,
      path: `${url.pathname}${url.search}`,
      body,
      headers: new Headers(init?.headers),
    });

    const response =
      url.pathname === '/v1/tools/stagehand.act/call'
        ? { clicked: true }
        : url.pathname === '/v1/tools/captcha.solve/calls'
          ? { id: 'call_1', status: 'queued' }
          : url.pathname === '/v1/tool-calls/call_1/result'
            ? { token: 'solved' }
            : url.pathname === '/v1/conversations'
              ? method === 'POST'
                ? { id: 'conv_1', status: 'idle' }
                : { data: [], nextCursor: null }
                : url.pathname === '/v1/conversations/conv_1'
                  ? { id: 'conv_1', agent: 'stagehand', status: 'idle' }
                  : url.pathname === '/v1/conversations/conv_1/messages'
                    ? { conversationId: 'conv_1', turnId: 'turn_1' }
                  : url.pathname === '/v1/runs/run_1/trace'
                    ? { data: [], nextCursor: null }
                    : url.pathname === '/v1/runs/run_1/events'
                      ? { data: [], nextCursor: null }
                      : url.pathname === '/v1/browser/extensions'
                        ? { data: [], nextCursor: null }
                        : {};
    return new Response(JSON.stringify(response), {
      status: method === 'POST' ? 202 : 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const client = new Bctrl({
    apiKey: 'test',
    baseUrl: 'https://api.example.test',
    fetch: fetchMock,
  });

  const actResult = await client.tools.call('stagehand.act', {
    instruction: 'Continue',
  }, { runtimeId: 'rt_1' });
  void actResult.success;
  await client.tools.start('captcha.solve', {}, { runtimeId: 'rt_1' });
  await client.tools.start(
    'code.execute',
    {
      source: 'export default async () => ({ ok: true });',
      input: { value: 1 },
      timeoutMs: 1_000,
    },
    { runtimeId: 'rt_1', idempotencyKey: 'code-execute-1' }
  );
  if (false) {
    // @ts-expect-error stagehand.act requires an instruction
    await client.tools.call('stagehand.act', {}, { runtimeId: 'rt_1' });
    // @ts-expect-error runtime.files.list does not advertise asynchronous execution
    await client.tools.start('runtime.files.list', { runtimeId: 'rt_1' });
  }
  await client.toolCalls.result('call_1', { waitSeconds: 30 });
  await client.conversations.create({ agent: 'browser-use', runtimeId: 'rt_1' });
  await client.conversations.update('conv_1', { agent: 'stagehand' });
  await client.conversations.messages.create('conv_1', { text: 'Complete checkout' });
  await client.runs.trace.list('run_1');
  await client.runs.events.list('run_1');
  await client.runs.get('run_1', { include: 'connection' });
  await client.runtimes.get('rt_1', { include: 'connection' });
  await client.browserExtensions.list();

  assert.deepEqual(
    requests.map(({ method, path }) => `${method} ${path}`),
    [
      'POST /v1/tools/stagehand.act/call',
      'POST /v1/tools/captcha.solve/calls',
      'POST /v1/tools/code.execute/calls',
      'GET /v1/tool-calls/call_1/result?waitSeconds=30',
      'POST /v1/conversations',
      'PATCH /v1/conversations/conv_1',
      'POST /v1/conversations/conv_1/messages',
      'GET /v1/runs/run_1/trace',
      'GET /v1/runs/run_1/events',
      'GET /v1/runs/run_1?include=connection',
      'GET /v1/runtimes/rt_1?include=connection',
      'GET /v1/browser/extensions',
    ]
  );
  assert.equal(requests[0]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[1]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[2]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[2]?.headers.get('idempotency-key'), 'code-execute-1');
  assert.equal((requests[0]?.body as Record<string, unknown>)?.runtimeId, undefined);

  assert.equal('invocations' in client, false);
  assert.equal('vault' in client, false);
  assert.equal('targets' in client.runtimes, false);
  assert.equal('humanActions' in client.runtimes, false);
});
