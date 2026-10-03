import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, type V1Browser } from '../../src/index.js';

test('computer.use preserves vendor action fields and returns a typed desktop result', async () => {
  const requests: unknown[] = [];
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://api.example.test', fetch: async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ action: 'scroll', width: 800, height: 600 }), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const input = { action: 'scroll', scroll_direction: 'down', scroll_amount: 2, coordinate: [20, 30] } as const;
  const result = await client.tools.call('computer.use', { ...input, coordinate: [20, 30] }, { runtimeId: 'rt_test' });
  assert.equal(result.width, 800); assert.deepEqual(requests, [input]);
});

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
  await client.browsers.start('rt_1');
  await client.runs.trace.list('run_1');
  await client.runs.events.list('run_1');
  await client.runs.get('run_1', { include: 'usage' });
  await client.runs.files.list('run_1', { role: 'input' });
  await client.runs.files.add('run_1', 'file_1');
  await client.runs.files.upload(
    'run_1',
    { file: new Blob(['x']), filename: 'a.txt' },
    { idempotencyKey: 'upload-1' }
  );
  await client.runs.files.retry('run_1', 'file_1');
  await client.runs.files.remove('run_1', 'file_1');
  await client.runs.files.collect('run_1', { runtimePath: 'downloads/r.pdf' });
  await client.browsers.stop('br_1', { discardState: true }, { idempotencyKey: 'stop-1' });
  await client.browsers.get('br_1', { wait: 0 });
  await client.browserExtensions.list();
  await client.proxies.geo.list({ country: 'us', type: 'city' });
  await client.proxies.locations.list({ pool: 'pool1', limit: 10 });
  await client.locations.list({ limit: 1, order: 'asc' });

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
      'POST /v1/browsers/rt_1/start',
      'GET /v1/runs/run_1/trace',
      'GET /v1/runs/run_1/events',
      'GET /v1/runs/run_1?include=usage',
      'GET /v1/runs/run_1/files?role=input',
      'POST /v1/runs/run_1/files',
      'POST /v1/runs/run_1/files/upload',
      'POST /v1/runs/run_1/files/file_1/retry',
      'DELETE /v1/runs/run_1/files/file_1',
      'POST /v1/runs/run_1/files/collect',
      'POST /v1/browsers/br_1/stop',
      'GET /v1/browsers/br_1?wait=0',
      'GET /v1/browser/extensions',
      'GET /v1/proxies/geo?country=us&type=city',
      'GET /v1/proxies/locations?pool=pool1&limit=10',
      'GET /v1/locations?limit=1&order=asc',
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
  assert.deepEqual(requests[17]?.body, { discardState: true });
  assert.equal(requests[17]?.headers.get('idempotency-key'), 'stop-1');
  assert.equal('runtimes' in client, false);

  assert.equal('invocations' in client, false);
  assert.equal('vault' in client, false);
  assert.equal('targets' in client.browsers, false);
  assert.equal('humanActions' in client.browsers, false);
});

test('browser lifecycle keeps current Run connections and separates stop state from metadata', async () => {
  const timestamp = '2026-10-02T00:00:00.000Z';
  const browser: V1Browser = {
    object: 'browser', id: 'br_1', type: 'browser', spaceId: 'sp_1', name: 'Browser',
    location: 'auto', status: 'running', savedState: { status: 'none', sizeBytes: null },
    lastUsedAt: timestamp, expireAfterIdleDays: 7, stealth: 'normal', gpu: false,
    viewport: { width: 1920, height: 1080 }, headless: false, recording: true,
    timeoutSeconds: 3600, standbyAfterSeconds: 0, autoUpgrade: true,
    webRtcProxyOnly: true, forceOpenShadowRoots: false, extensions: [], metadata: {},
    createdAt: timestamp, updatedAt: timestamp,
    currentRun: {
      object: 'run', id: 'run_1', resourceId: 'br_1', resourceType: 'browser', spaceId: 'sp_1',
      status: 'active', location: 'us-east', control: { holder: 'agent', since: timestamp },
      startedAt: timestamp, endedAt: null, endReason: null, recording: { enabled: true },
      createdAt: timestamp, updatedAt: timestamp,
      connections: { cdpUrl: 'wss://edge.test/cdp', webdriverUrl: 'https://edge.test/wd',
        liveViewUrl: 'https://view.test/input', liveViewReadOnlyUrl: 'https://view.test/read', expiresAt: timestamp },
    },
  };
  const requests: Array<{ method: string; path: string; body: unknown; key: string | null }> = [];
  const client = new Bctrl({ apiKey: 'test', baseUrl: 'https://example.test', fetch: async (input, init) => {
    const url = new URL(String(input));
    requests.push({ method: init?.method ?? 'GET', path: url.pathname + url.search,
      body: init?.body ? JSON.parse(String(init.body)) : null, key: new Headers(init?.headers).get('idempotency-key') });
    const body = url.pathname.endsWith('/runs') ? { data: [browser.currentRun], nextCursor: null, hasMore: false }
      : init?.method === 'DELETE' ? { object: 'deleted', id: browser.id, deleted: true } : browser;
    return Response.json(body, { status: 200 });
  } });
  const created = await client.browsers.create({ name: 'Browser', headless: true }, { idempotencyKey: 'create-1' });
  assert.deepEqual(created.currentRun?.connections, browser.currentRun?.connections);
  assert.equal(requests.length, 1, 'create returns its Run without another start or credential lookup');
  await client.browsers.get('name / encoded', { wait: 2 });
  await client.browsers.start('br_1', { idempotencyKey: 'start-1', spaceId: 'default' });
  await client.browsers.stop('br_1', { discardState: true }, { idempotencyKey: 'stop-1' });
  await client.browsers.update('br_1', { recording: false });
  assert.equal((await client.browsers.listRuns('br_1', { include: 'usage', status: 'ended' })).data[0]?.id, 'run_1');
  await client.browsers.revokeConnections('br_1', { idempotencyKey: 'revoke-1' });
  await client.browsers.delete('br_1');
  assert.deepEqual(requests, [
    { method: 'POST', path: '/v1/browsers', body: { name: 'Browser', headless: true }, key: 'create-1' },
    { method: 'GET', path: '/v1/browsers/name%20%2F%20encoded?wait=2', body: null, key: null },
    { method: 'POST', path: '/v1/browsers/br_1/start?spaceId=default', body: {}, key: 'start-1' },
    { method: 'POST', path: '/v1/browsers/br_1/stop', body: { discardState: true }, key: 'stop-1' },
    { method: 'PATCH', path: '/v1/browsers/br_1', body: { recording: false }, key: null },
    { method: 'GET', path: '/v1/browsers/br_1/runs?include=usage&status=ended', body: null, key: null },
    { method: 'POST', path: '/v1/browsers/br_1/connections/revoke', body: {}, key: 'revoke-1' },
    { method: 'DELETE', path: '/v1/browsers/br_1', body: null, key: null },
  ]);
  if (false) {
    // @ts-expect-error profile flags are removed from browser creation
    await client.browsers.create({ profile: true });
    // @ts-expect-error each browser create starts its first Run
    await client.browsers.create({ start: false });
    // @ts-expect-error start configuration belongs to the resource PATCH
    await client.browsers.start('br_1', { recording: false });
  }
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
