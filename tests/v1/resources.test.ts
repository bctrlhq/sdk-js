import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl, type BrowserResource } from '../../src/index.js';

test('computer.use keeps vendor action fields and names its browser in the body', async () => {
  const requests: unknown[] = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (_input, init) => {
    requests.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ object: 'tool_call', id: 'tc_1', tool: 'computer.use', status: 'succeeded', resultAvailable: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const input = { action: 'scroll', scroll_direction: 'down', scroll_amount: 2, coordinate: [20, 30] } as const;
  const call = await client.tools.calls.create({ toolRef: 'computer.use', input: { ...input, coordinate: [20, 30] }, runtimeId: 'br_test', wait: 30 });
  assert.equal(call.status, 'succeeded');
  assert.deepEqual(requests, [{ input, runtimeId: 'br_test' }]);
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
      url.pathname === '/v1/tools/stagehand.act/calls'
        ? { id: 'call_0', status: 'succeeded' }
        : url.pathname === '/v1/tools/captcha.solve/calls'
          ? { id: 'call_1', status: 'queued' }
          : url.pathname === '/v1/tool-calls/call_1/result'
            ? { token: 'solved' }
            : url.pathname === '/v1/tasks'
              ? { id: 'task_1', status: 'queued' }
                : url.pathname === '/v1/conversations/conv_1'
                  ? { id: 'conv_1', status: 'idle' }
                  : url.pathname === '/v1/runs/run_1/trace'
                    ? { data: [], nextCursor: null }
                    : url.pathname === '/v1/events'
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
    token: 'test',
    baseUrl: 'https://api.example.test',
    fetch: fetchMock,
  });

  const act = await client.tools.calls.create({ toolRef: 'stagehand.act', input: { instruction: 'Continue' }, runtimeId: 'rt_1', wait: 30 });
  assert.equal(act.status, 'succeeded');
  await client.tools.calls.create({ toolRef: 'captcha.solve', input: {}, runtimeId: 'rt_1' });
  await client.tools.calls.create({ toolRef: 'code.execute', input: {
      source: 'export default async () => ({ ok: true });',
      input: { value: 1 },
      language: 'typescript',
      maxLogBytes: 500_000,
      timeoutMs: 1_000,
    }, "Idempotency-Key": 'code-execute-1' });
  await client.toolCalls.result({ toolCallId: 'call_1', wait: 30 });
  await client.tasks.create({ agent: 'agt_1', input: 'Complete checkout' });
  await client.conversations.update({ conversationId: 'conv_1' });
  await client.browsers.start({ browserId: 'rt_1' });
  await client.runs.trace.list({ runId: 'run_1' });
  await client.events.list({ run: 'run_1' });
  await client.runs.get({ runId: 'run_1', include: 'usage' });
  await client.runs.files.list({ runId: 'run_1', role: 'input' });
  await client.runs.files.add({ runId: 'run_1', fileId: 'file_1' });
  await client.runs.files.upload({ runId: 'run_1', file: new Blob(['x']), filename: 'a.txt', "Idempotency-Key": 'upload-1' });
  await client.runs.files.retry({ runId: 'run_1', fileId: 'file_1' });
  await client.runs.files.remove({ runId: 'run_1', fileId: 'file_1' });
  await client.runs.files.collect({ runId: 'run_1', runtimePath: 'downloads/r.pdf' });
  await client.browsers.stop({ browserId: 'br_1', discardState: true, "Idempotency-Key": 'stop-1' });
  await client.browsers.get({ browserId: 'br_1', wait: 0 });
  await client.browser.extensions.list({  });
  await client.proxies.geo.list({ country: 'us', type: 'city' });
  await client.proxies.locations.list({ pool: 'pool1', limit: 10 });
  await client.locations.list({ limit: 1, order: 'asc' });

  assert.deepEqual(
    requests.map(({ method, path }) => `${method} ${path}`),
    [
      'POST /v1/tools/stagehand.act/calls?wait=30',
      'POST /v1/tools/captcha.solve/calls',
      'POST /v1/tools/code.execute/calls',
      'GET /v1/tool-calls/call_1/result?wait=30',
      'POST /v1/tasks',
      'PATCH /v1/conversations/conv_1',
      'POST /v1/browsers/rt_1/start',
      'GET /v1/runs/run_1/trace',
      'GET /v1/events?run=run_1',
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
      'GET /v1/proxies/locations?limit=10&pool=pool1',
      'GET /v1/locations?order=asc&limit=1',
    ]
  );
  // The browser is a body field now; the old BCTRL-Runtime-Id header is gone.
  assert.equal(requests[0]?.headers.get('bctrl-runtime-id'), null);
  assert.equal((requests[0]?.body as Record<string, unknown>)?.runtimeId, 'rt_1');
  assert.equal((requests[1]?.body as Record<string, unknown>)?.runtimeId, 'rt_1');
  assert.equal((requests[2]?.body as Record<string, unknown>)?.runtimeId, undefined);
  assert.equal(requests[2]?.headers.get('idempotency-key'), 'code-execute-1');
  assert.deepEqual(requests[4]?.body, { agent: 'agt_1', input: 'Complete checkout' });
  assert.deepEqual(requests[6]?.body, {});
  assert.deepEqual(requests[11]?.body, { fileId: 'file_1' });
  assert.equal(requests[12]?.headers.get('idempotency-key'), 'upload-1');
  assert.deepEqual(requests[16]?.body, { discardState: true });
  assert.equal(requests[16]?.headers.get('idempotency-key'), 'stop-1');
  assert.equal('runtimes' in client, false);

  assert.equal('invocations' in client, false);
  assert.equal('vault' in client, false);
  assert.equal('targets' in client.browsers, false);
  assert.equal('humanActions' in client.browsers, false);
});

test('browser lifecycle keeps current Run connections and separates stop state from metadata', async () => {
  const timestamp = '2026-10-02T00:00:00.000Z';
  const browser: BrowserResource = JSON.parse(readFileSync(new URL('../fixtures/browser.json', import.meta.url), 'utf8'));
  const requests: Array<{ method: string; path: string; body: unknown; key: string | null }> = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://example.test', fetch: async (input, init) => {
    const url = new URL(String(input));
    requests.push({ method: init?.method ?? 'GET', path: url.pathname + url.search,
      body: init?.body ? JSON.parse(String(init.body)) : null, key: new Headers(init?.headers).get('idempotency-key') });
    const body = url.pathname.endsWith('/runs') ? { data: [browser.currentRun], nextCursor: null, hasMore: false }
      : init?.method === 'DELETE' ? { object: 'deleted', id: browser.id, deleted: true } : browser;
    return Response.json(body, { status: 200 });
  } });
  const created = await client.browsers.create({ name: 'Browser', headless: true, "Idempotency-Key": 'create-1' });
  assert.deepEqual(created.currentRun?.connections, browser.currentRun?.connections);
  assert.equal(requests.length, 1, 'create returns its Run without another start or credential lookup');
  await client.browsers.get({ browserId: 'name / encoded', wait: 2 });
  await client.browsers.start({ browserId: 'br_1', "Idempotency-Key": 'start-1', spaceId: 'default' });
  await client.browsers.stop({ browserId: 'br_1', discardState: true, "Idempotency-Key": 'stop-1' });
  await client.browsers.update({ browserId: 'br_1', recording: false });
  assert.equal((await client.browsers.runs.list({ browserId: 'br_1', include: 'usage', status: 'ended' })).data[0]?.id, browser.currentRun!.id);
  await client.browsers.connections.revoke({ browserId: 'br_1', "Idempotency-Key": 'revoke-1' });
  await client.browsers.delete({ browserId: 'br_1' });
  assert.ok(requests[4]?.key);
  assert.ok(requests[7]?.key);
  assert.deepEqual(requests, [
    { method: 'POST', path: '/v1/browsers', body: { name: 'Browser', headless: true }, key: 'create-1' },
    { method: 'GET', path: '/v1/browsers/name%20%2F%20encoded?wait=2', body: null, key: null },
    { method: 'POST', path: '/v1/browsers/br_1/start?spaceId=default', body: {}, key: 'start-1' },
    { method: 'POST', path: '/v1/browsers/br_1/stop', body: { discardState: true }, key: 'stop-1' },
    { method: 'PATCH', path: '/v1/browsers/br_1', body: { recording: false }, key: requests[4]!.key },
    { method: 'GET', path: '/v1/browsers/br_1/runs?status=ended&include=usage', body: null, key: null },
    { method: 'POST', path: '/v1/browsers/br_1/connections/revoke', body: {}, key: 'revoke-1' },
    { method: 'DELETE', path: '/v1/browsers/br_1', body: null, key: requests[7]!.key },
  ]);
  if (false) {
    // @ts-expect-error profile flags are removed from browser creation
    await client.browsers.create({ profile: true });
    // @ts-expect-error each browser create starts its first Run
    await client.browsers.create({ start: false });
    // @ts-expect-error start configuration belongs to the resource PATCH
    await client.browsers.start({ browserId: 'br_1', recording: false });
  }
});

test('agent keys send the agent name and retain the person and usage metadata', async () => {
  let body: unknown;
  const response = { data: { id: 'key-agent', type: 'agent', agent: { name: 'Invoice bot' },
    actsFor: { userId: 'person-1' }, lastUsedAt: '2026-09-30T01:00:00.000Z' }, secret: 'test-only-secret' };
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return Response.json(response, { status: 201 });
  } });
  const created = await client.apiKeys.create({ body: { type: 'agent', agent: { name: 'Invoice bot' } } });
  assert.deepEqual(body, { type: 'agent', agent: { name: 'Invoice bot' } });
  assert.equal(created.data.type, 'agent');
  if (created.data.type !== 'agent') throw new Error('missing agent response');
  assert.deepEqual(created.data.actsFor, { userId: 'person-1' });
  assert.equal(created.data.agent.name, 'Invoice bot');
  assert.equal(created.data.lastUsedAt, response.data.lastUsedAt);
});

test('Space Secret environment references survive create, PATCH and clearing', async () => {
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test',
    fetch: async (input, init) => {
      requests.push({ method: init?.method ?? 'GET', path: new URL(String(input)).pathname,
        body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ id: 'sp_test' }), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    } });
  const secrets = { allow: ['prod'], deny: ['prod/root'], env: { OPENAI_API_KEY: 'secret:prod/api#value@3' } };
  await client.spaces.create({ name: 'Secret env', environment: { secrets } });
  await client.spaces.update({ spaceId: 'sp_test', environment: { secrets } });
  await client.spaces.update({ spaceId: 'sp_test', environment: { secrets: null } });
  assert.deepEqual(requests, [
    { method: 'POST', path: '/v1/spaces', body: { name: 'Secret env', environment: { secrets } } },
    { method: 'PATCH', path: '/v1/spaces/sp_test', body: { environment: { secrets } } },
    { method: 'PATCH', path: '/v1/spaces/sp_test', body: { environment: { secrets: null } } },
  ]);
});
