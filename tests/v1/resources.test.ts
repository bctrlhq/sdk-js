import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, type V1RuntimeStartAccepted } from '../../src/index.js';

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
                  ? { id: 'conv_1', status: 'idle' }
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
      language: 'typescript',
      maxLogBytes: 500_000,
      timeoutMs: 1_000,
    },
    { runtimeId: 'rt_1', idempotencyKey: 'code-execute-1' }
  );
  if (false) {
    // @ts-expect-error tools.call takes no idempotency key: its output is never replayed
    await client.tools.call('stagehand.act', { instruction: 'Continue' }, { idempotencyKey: 'k' });
    // @ts-expect-error stagehand.act requires an instruction
    await client.tools.call('stagehand.act', {}, { runtimeId: 'rt_1' });
    // @ts-expect-error runtime.files.list does not advertise asynchronous execution
    await client.tools.start('runtime.files.list', { runtimeId: 'rt_1' });
  }
  await client.toolCalls.result('call_1', { wait: 30 });
  await client.conversations.create({ runtimeId: 'rt_1' });
  await client.conversations.update('conv_1', {});
  await client.conversations.messages.create('conv_1', { text: 'Complete checkout' });
  await client.runtimes.start('rt_1');
  await client.runs.trace.list('run_1');
  await client.runs.events.list('run_1');
  await client.runs.get('run_1', { include: 'connection' });
  await client.runs.files.list('run_1', { role: 'input' });
  await client.runs.files.add('run_1', 'file_1');
  await client.runs.files.upload(
    'run_1',
    { file: new Blob(['x']), name: 'a.txt' },
    { idempotencyKey: 'upload-1' }
  );
  await client.runs.files.retry('run_1', 'file_1');
  await client.runs.files.remove('run_1', 'file_1');
  await client.runs.files.collect('run_1', { runtimePath: 'downloads/r.pdf' });
  await client.runtimes.start('rt_1', { files: [{ fileId: 'file_1' }] });
  await client.runtimes.get('rt_1', { include: 'connection' });
  await client.browserExtensions.list();
  await client.proxies.geo.list({ country: 'us', type: 'city' });
  await client.proxies.locations.list({ pool: 'pool1', limit: 10 });

  assert.deepEqual(
    requests.map(({ method, path }) => `${method} ${path}`),
    [
      'POST /v1/tools/stagehand.act/call',
      'POST /v1/tools/captcha.solve/calls',
      'POST /v1/tools/code.execute/calls',
      'GET /v1/tool-calls/call_1/result?wait=30',
      'POST /v1/conversations',
      'PATCH /v1/conversations/conv_1',
      'POST /v1/conversations/conv_1/messages',
      'POST /v1/runtimes/rt_1/start',
      'GET /v1/runs/run_1/trace',
      'GET /v1/runs/run_1/events',
      'GET /v1/runs/run_1?include=connection',
      'GET /v1/runs/run_1/files?role=input',
      'POST /v1/runs/run_1/files',
      'POST /v1/runs/run_1/files/upload',
      'POST /v1/runs/run_1/files/file_1/retry',
      'DELETE /v1/runs/run_1/files/file_1',
      'POST /v1/runs/run_1/files/collect',
      'POST /v1/runtimes/rt_1/start',
      'GET /v1/runtimes/rt_1?include=connection',
      'GET /v1/browser/extensions',
      'GET /v1/proxies/geo?country=us&type=city',
      'GET /v1/proxies/locations?pool=pool1&limit=10',
    ]
  );
  assert.equal(requests[0]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[1]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[2]?.headers.get('bctrl-runtime-id'), 'rt_1');
  assert.equal(requests[2]?.headers.get('idempotency-key'), 'code-execute-1');
  assert.equal((requests[0]?.body as Record<string, unknown>)?.runtimeId, undefined);
  assert.deepEqual(requests[7]?.body, {});
  assert.deepEqual(requests[12]?.body, { fileId: 'file_1' });
  assert.equal(requests[13]?.headers.get('idempotency-key'), 'upload-1');
  assert.deepEqual(requests[17]?.body, { files: [{ fileId: 'file_1' }] });

  assert.equal('invocations' in client, false);
  assert.equal('vault' in client, false);
  assert.equal('targets' in client.runtimes, false);
  assert.equal('humanActions' in client.runtimes, false);
});

test('async waits use query parameters and preserve the accepted runtime handle', async () => {
  const requests: Array<{ path: string; body: unknown }> = [];
  const handle: V1RuntimeStartAccepted = { runtimeId: 'rt_1', runId: 'run_1', status: 'starting' };
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://example.test', fetch: async (input, init) => {
    const url = new URL(String(input));
    requests.push({ path: url.pathname + url.search, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(JSON.stringify(url.pathname.includes('/turns/') ? { id: 'turn_1', status: 'succeeded' } : handle), {
      status: url.pathname.includes('/turns/') ? 200 : 202, headers: { 'content-type': 'application/json' },
    });
  }});
  const started = await client.runtimes.start('rt_1', { wait: 0, recording: false });
  assert.deepEqual(started, handle);
  if (started.status === 'starting') {
    void started.runId;
    // @ts-expect-error accepted handles carry no connection credentials
    void started.connection;
  }
  assert.deepEqual(await client.runtimes.get('rt_1', { wait: 1 }), handle);
  await client.conversations.turns.get('conv_1', 'turn_1', { wait: 60 });
  await client.conversations.turns.cancel('conv_1', 'turn_1');
  assert.deepEqual(requests, [
    { path: '/v1/runtimes/rt_1/start?wait=0', body: { recording: false } },
    { path: '/v1/runtimes/rt_1?wait=1', body: null },
    { path: '/v1/conversations/conv_1/turns/turn_1?wait=60', body: null },
    { path: '/v1/conversations/conv_1/turns/turn_1/cancel', body: null },
  ]);
});


test('agent keys send the agent name and retain the person and usage metadata', async () => {
  let body: unknown;
  const response = { data: { id: 'key-agent', type: 'agent', agent: { name: 'Invoice bot' },
    actsFor: { userId: 'person-1' }, lastUsedAt: '2026-09-30T01:00:00.000Z' }, secret: 'test-only-secret' };
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://api.example.test', fetch: async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json(response, { status: 201 });
  } });
  const created = await client.apiKeys.create({ type: 'agent', agent: { name: 'Invoice bot' } });
  assert.deepEqual(body, { type: 'agent', agent: { name: 'Invoice bot' } });
  assert.equal(created.data.type, 'agent');
  if (created.data.type !== 'agent') throw new Error('missing agent response');
  assert.deepEqual(created.data.actsFor, { userId: 'person-1' });
  assert.equal(created.data.agent.name, 'Invoice bot');
  assert.equal(created.data.lastUsedAt, response.data.lastUsedAt);
});

test('Space Secret environment references survive create, PATCH and clearing', async () => {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://api.example.test',
    fetch: async (input, init) => {
      requests.push({ method: init?.method ?? 'GET', path: new URL(String(input)).pathname,
        body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ id: 'sp_test' }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    } });
  const secrets = { allow: ['prod'], deny: ['prod/root'], env: { OPENAI_API_KEY: 'secret:prod/api#value@3' } };
  await client.spaces.create({ name: 'Secret env', environment: { secrets } });
  await client.spaces.update('sp_test', { environment: { secrets } });
  await client.spaces.update('sp_test', { environment: { secrets: null } });
  assert.deepEqual(requests, [
    { method: 'POST', path: '/v1/spaces', body: { name: 'Secret env', environment: { secrets } } },
    { method: 'PATCH', path: '/v1/spaces/sp_test', body: { environment: { secrets } } },
    { method: 'PATCH', path: '/v1/spaces/sp_test', body: { environment: { secrets: null } } },
  ]);
});
