import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('the SDK exposes only the canonical automation resources and routes', async () => {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : init?.body ?? null;
    requests.push({ method, path: `${url.pathname}${url.search}`, body });

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
              : url.pathname === '/v1/conversations/conv_1/messages'
                ? { conversationId: 'conv_1', turnId: 'turn_1' }
                : url.pathname === '/v1/agents'
                  ? { data: [], nextCursor: null }
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
    runtimeId: 'rt_1',
    instruction: 'Continue',
  });
  void actResult.success;
  await client.tools.start('captcha.solve', { runtimeId: 'rt_1' });
  if (false) {
    // @ts-expect-error stagehand.act requires an instruction
    await client.tools.call('stagehand.act', { runtimeId: 'rt_1' });
    // @ts-expect-error runtime.files.list does not advertise asynchronous execution
    await client.tools.start('runtime.files.list', { runtimeId: 'rt_1' });
  }
  await client.toolCalls.result('call_1', { waitSeconds: 30 });
  await client.agents.list();
  await client.conversations.create({ agent: 'browser-use', runtimeId: 'rt_1' });
  await client.conversations.messages.create('conv_1', { text: 'Complete checkout' });
  await client.runs.trace.list('run_1');
  await client.runs.events.list('run_1');
  await client.browserExtensions.list();

  assert.deepEqual(
    requests.map(({ method, path }) => `${method} ${path}`),
    [
      'POST /v1/tools/stagehand.act/call',
      'POST /v1/tools/captcha.solve/calls',
      'GET /v1/tool-calls/call_1/result?waitSeconds=30',
      'GET /v1/agents',
      'POST /v1/conversations',
      'POST /v1/conversations/conv_1/messages',
      'GET /v1/runs/run_1/trace',
      'GET /v1/runs/run_1/events',
      'GET /v1/browser/extensions',
    ]
  );

  assert.equal('invocations' in client, false);
  assert.equal('vault' in client, false);
  assert.equal('targets' in client.runtimes, false);
  assert.equal('humanActions' in client.runtimes, false);
});
