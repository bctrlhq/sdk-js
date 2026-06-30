import assert from 'node:assert/strict';
import http from 'node:http';
import { afterEach, beforeEach, test } from 'node:test';

import { z } from 'zod';

import { Bctrl, BctrlNotFoundError } from '../../src/index.js';
import * as BctrlSdk from '../../src/index.js';
import {
  bodyField,
  browserExtensionFixture,
  fileFixture,
  humanActionFixture,
  invocationFixture,
  iso,
  json,
  managedStaticProxyFixture,
  notificationRecipientFixture,
  paths,
  proxyFixture,
  proxyPoolFixture,
  readJson,
  runFixture,
  runtimeFixture,
  toolFixture,
  toolVersionFixture,
  type RecordedRequest,
} from './mockFixtures.js';

interface MockServer {
  baseUrl: string;
  requests: RecordedRequest[];
  close(): Promise<void>;
}

let server: MockServer | null = null;

beforeEach(async () => {
  server = await createMockServer();
});

afterEach(async () => {
  await server?.close();
  server = null;
});

test('root SDK export uses v1 routes and exposes public account/auth surface', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  assert.equal('auth' in client, true);
  assert.equal('whoami' in client, false);
  assert.equal('handle' in client.runtimes, false);
  assert.equal('handle' in client.runs, false);
  assert.equal('handle' in client.spaces, false);
  for (const exportName of [
    'V1BrowserExtensionResource',
    'V1FileResource',
    'V1InvocationResource',
    'V1ProxyResource',
    'V1RunResource',
    'V1RuntimeResource',
    'V1SpaceResource',
    'V1ToolResource',
    'V1VaultSecretResource',
  ]) {
    assert.equal(exportName in BctrlSdk, false, exportName);
  }

  const space = await client.spaces.create({
    name: 'sdk-v1',
  });

  assert.equal(space.id, 'space_1');
  assert.deepEqual(paths(server.requests), ['POST /v1/spaces']);
  assert.equal(server.requests[0]?.headers.authorization, 'Bearer test_key');
  assert.equal((server.requests[0]?.body as { name?: string }).name, 'sdk-v1');
});

test('withSubaccount returns an immutable scoped client that sends acting context', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });
  const acme = client.withSubaccount('sub_acme');

  await acme.spaces.create({ name: 'acme-space' });
  await client.spaces.create({ name: 'root-space' });

  assert.deepEqual(paths(server.requests), ['POST /v1/spaces', 'POST /v1/spaces']);
  assert.equal(server.requests[0]?.headers['bctrl-subaccount-id'], 'sub_acme');
  assert.equal(server.requests[1]?.headers['bctrl-subaccount-id'], undefined);
});

test('account, ai, toolset, and tool-call clients mirror public routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const whoami = await client.auth.whoami();
  const usage = await client.usage.get();
  const key = await client.apiKeys.create({ name: 'sdk-key' });
  const subaccount = await client.subaccounts.create({ name: 'Customer A' });
  const aiCredential = await client.ai.credentials.create({
    provider: 'openai',
    name: 'OpenAI',
    apiKey: 'sk-test',
  });
  const aiModels = await client.ai.models.list({ provider: 'openai' });
  const toolset = await client.toolsets.create({
    name: 'browser_tools',
    builtins: ['files'],
  });
  const toolCalls = await client.toolCalls.list({ spaceId: 'space_1' });

  assert.equal(whoami.defaultSpaceId, 'space_1');
  assert.equal(usage.organizationId, 'org_1');
  assert.equal(key.secret, 'bctrl_secret');
  assert.equal(subaccount.id, 'sub_1');
  assert.equal(aiCredential.provider, 'openai');
  assert.equal(aiModels.data[0]?.id, 'openai/gpt-5');
  assert.equal(toolset.name, 'browser_tools');
  assert.equal(toolCalls.data[0]?.tool.name, 'normalize_price');

  assert.deepEqual(paths(server.requests), [
    'GET /v1/auth/whoami',
    'GET /v1/usage',
    'POST /v1/api-keys',
    'POST /v1/subaccounts',
    'POST /v1/ai/credentials',
    'GET /v1/ai/models?provider=openai',
    'POST /v1/toolsets',
    'GET /v1/tool-calls?spaceId=space_1',
  ]);
});

test('client uses BCTRL_BASE_URL when baseUrl option is omitted', async () => {
  assert(server);
  const previous = process.env.BCTRL_BASE_URL;
  process.env.BCTRL_BASE_URL = server.baseUrl;
  try {
    const client = new Bctrl({ apiKey: 'test_key' });
    await client.spaces.create({
      name: 'sdk-env-base-url',
    });
  } finally {
    if (previous === undefined) delete process.env.BCTRL_BASE_URL;
    else process.env.BCTRL_BASE_URL = previous;
  }

  assert.deepEqual(paths(server.requests), ['POST /v1/spaces']);
});

test('help helper uses canonical GET route with query filters', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const help = await client.help.get({ topic: 'runtimes.create', audience: 'api' });

  assert.equal(help.kind, 'topic');
  assert.equal(help.topic, 'runtimes.create');
  assert.deepEqual(paths(server.requests), ['GET /v1/help?topic=runtimes.create&audience=api']);
});

test('runtime helpers use native v1 invocations and files routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const space = await client.spaces.create({
    name: 'sdk-v1',
  });
  const createdRuntime = await client.spaces.runtimes.create(space.id, {
    type: 'browser',
    name: 'route-check',
    metadata: { test: true },
    config: {
      profile: false,
    },
  });
  const start = await client.runtimes.start(createdRuntime.id);
  const runtime = await client.runtimes.get(start.runtimeId);
  const invocation = await client.runtimes.invocations.create(runtime.id, {
    action: 'act',
    instruction: 'click the button',
  });
  const run = await client.runs.get(start.runId);
  await client.runs.files.list(run.id);
  await client.files.list({ spaceId: space.id });
  await client.runtimes.files.upload(runtime.id, {
    file: new Blob(['hello'], { type: 'text/plain' }),
    name: 'hello.txt',
    destinationPath: 'inputs/hello.txt',
    runtimePath: 'inputs/hello.txt',
  });
  await client.runtimes.files.stage(runtime.id, {
    fileId: 'file_data',
    runtimePath: 'inputs/data.json',
  });
  await client.runtimes.files.collect(runtime.id, {
    runtimePath: 'outputs/output.json',
    destinationPath: 'outputs/output.json',
  });

  assert.equal(runtime.id, 'runtime_1');
  assert.equal(start.connectUrl, 'wss://example.test/devtools');
  assert.equal(start.protocol, 'cdp');
  assert.equal(start.started, true);
  assert.equal(invocation.id, 'invocation_1');
  assert.equal(run.id, 'run_1');

  assert.deepEqual(paths(server.requests), [
    'POST /v1/spaces',
    'POST /v1/runtimes',
    'POST /v1/runtimes/runtime_1/start',
    'GET /v1/runtimes/runtime_1',
    'POST /v1/runtimes/runtime_1/invocations',
    'GET /v1/runs/run_1',
    'GET /v1/runs/run_1/files',
    'GET /v1/files?spaceId=space_1',
    'POST /v1/runtimes/runtime_1/files/upload',
    'POST /v1/runtimes/runtime_1/files/stage',
    'POST /v1/runtimes/runtime_1/files/collect',
  ]);
  const uploadRequest = server.requests.find(
    (request) => request.path === '/v1/runtimes/runtime_1/files/upload'
  );
  assert.match(String(uploadRequest?.headers['content-type']), /^multipart\/form-data; boundary=/);
  assert.match(String(uploadRequest?.body), /name="destinationPath"\r\n\r\ninputs\/hello\.txt/);
  assert.match(String(uploadRequest?.body), /name="runtimePath"\r\n\r\ninputs\/hello\.txt/);

  for (const request of server.requests) {
    assert(!request.path.includes('/storage'), request.path);
    assert(!request.path.includes('/artifacts'), request.path);
  }
});

test('runtimes.start maps directly to start route without hidden get', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const started = await client.runtimes.start('runtime_1');

  assert.equal(started.runtimeId, 'runtime_1');
  assert.equal(started.runId, 'run_1');
  assert.equal(started.connectUrl, 'wss://example.test/devtools');
  assert.deepEqual(paths(server.requests), ['POST /v1/runtimes/runtime_1/start']);
});

test('runtime target helpers use live target routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const listed = await client.runtimes.targets.list('runtime_1');
  const created = await client.runtimes.targets.create('runtime_1', {
    uri: 'https://example.com',
    activate: true,
  });
  const fetched = await client.runtimes.targets.get('runtime_1', 'target_1');
  const activated = await client.runtimes.targets.activate('runtime_1', 'target_1');
  const deleted = await client.runtimes.targets.delete('runtime_1', 'target_1');

  assert.equal(listed.data[0]?.id, 'target_1');
  assert.equal(created.uri, 'https://example.com');
  assert.equal(fetched.active, true);
  assert.equal(activated.active, true);
  assert.deepEqual(deleted, { id: 'target_1', deleted: true });
  assert.deepEqual(paths(server.requests), [
    'GET /v1/runtimes/runtime_1/targets',
    'POST /v1/runtimes/runtime_1/targets',
    'GET /v1/runtimes/runtime_1/targets/target_1',
    'POST /v1/runtimes/runtime_1/targets/target_1/activate',
    'DELETE /v1/runtimes/runtime_1/targets/target_1',
  ]);
  assert.deepEqual(server.requests[1]?.body, {
    uri: 'https://example.com',
    activate: true,
  });
});

test('browser extension helpers use the cleaned v1 browser extension routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const listed = await client.browserExtensions.list({
    q: 'wallet',
    source: 'upload',
    format: 'crx',
    subaccountId: 'sub_1',
  });
  const uploaded = await client.browserExtensions.upload({
    file: new Blob(['fake-crx'], { type: 'application/octet-stream' }),
    name: 'Wallet',
    subaccountId: 'sub_1',
  });
  const imported = await client.browserExtensions.import({
    url: 'https://chromewebstore.google.com/detail/wallet/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    name: 'Wallet import',
    subaccountId: 'sub_1',
  });
  const fetched = await client.browserExtensions.get(uploaded.id);
  const updated = await client.browserExtensions.update(fetched.id, { name: 'Renamed Wallet' });
  const deleted = await client.browserExtensions.delete(updated.id);

  assert.equal(listed.data[0]?.id, 'ext_1');
  assert.equal(uploaded.id, 'ext_1');
  assert.equal(imported.sourceUrl?.includes('chromewebstore.google.com'), true);
  assert.equal(updated.name, 'Renamed Wallet');
  assert.deepEqual(deleted, { id: 'ext_1', deleted: true });

  assert.deepEqual(paths(server.requests), [
    'GET /v1/browser-extensions?q=wallet&source=upload&format=crx&subaccountId=sub_1',
    'POST /v1/browser-extensions/upload',
    'POST /v1/browser-extensions/import',
    'GET /v1/browser-extensions/ext_1',
    'PATCH /v1/browser-extensions/ext_1',
    'DELETE /v1/browser-extensions/ext_1',
  ]);
  const uploadRequest = server.requests[1];
  assert.match(String(uploadRequest?.headers['content-type']), /^multipart\/form-data; boundary=/);
  assert.match(String(uploadRequest?.body), /name="file"; filename="extension\.crx"/);
  assert.match(String(uploadRequest?.body), /name="name"\r\n\r\nWallet/);
  assert.match(String(uploadRequest?.body), /name="subaccountId"\r\n\r\nsub_1/);
  assert.deepEqual(server.requests[2]?.body, {
    url: 'https://chromewebstore.google.com/detail/wallet/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    name: 'Wallet import',
    subaccountId: 'sub_1',
  });
  assert.deepEqual(server.requests[4]?.body, { name: 'Renamed Wallet' });
});

test('notification recipient helpers use public notification routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const listed = await client.notificationRecipients.list({ type: 'email', enabled: true });
  const grouped = await client.account.notificationRecipients.list({ type: 'sms' });
  const created = await client.notificationRecipients.create({
    type: 'sms',
    value: '+15551234567',
    name: 'On-call',
  });
  const updated = await client.notificationRecipients.update(created.id, {
    enabled: false,
    name: null,
  });
  const deleted = await client.notificationRecipients.delete(updated.id);

  assert.equal(listed.data[0]?.id, 'recipient_1');
  assert.equal(grouped.data[0]?.id, 'recipient_1');
  assert.equal(created.type, 'sms');
  assert.equal(updated.enabled, false);
  assert.deepEqual(deleted, { id: 'recipient_1', deleted: true });
  assert.deepEqual(paths(server.requests), [
    'GET /v1/notification-recipients?type=email&enabled=true',
    'GET /v1/notification-recipients?type=sms',
    'POST /v1/notification-recipients',
    'PATCH /v1/notification-recipients/recipient_1',
    'DELETE /v1/notification-recipients/recipient_1',
  ]);
  assert.deepEqual(server.requests[2]?.body, {
    type: 'sms',
    value: '+15551234567',
    name: 'On-call',
  });
  assert.deepEqual(server.requests[3]?.body, {
    enabled: false,
    name: null,
  });
});

test('runtime human action helpers use runtime-scoped public routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const created = await client.runtimes.humanAction.create('runtime_1', {
    message: 'Please review checkout before purchase.',
    timeoutSeconds: 3600,
  });
  const fetched = await client.runtimes.humanAction.get('runtime_1');
  const waited = await client.runtimes.humanAction.wait('runtime_1', {
    timeoutSeconds: 30,
  });
  const completed = await client.runtimes.humanAction.complete('runtime_1');
  const cancelled = await client.runtimes.humanAction.cancel('runtime_1');

  assert.equal(created.id, 'human_action_1');
  assert.equal(fetched.status, 'pending');
  assert.equal(waited.waitStatus, 'timeout');
  assert.equal(completed.status, 'completed');
  assert.equal(cancelled.status, 'cancelled');
  assert.deepEqual(paths(server.requests), [
    'POST /v1/runtimes/runtime_1/human-actions',
    'GET /v1/runtimes/runtime_1/human-actions',
    'POST /v1/runtimes/runtime_1/human-actions/wait',
    'POST /v1/runtimes/runtime_1/human-actions/complete',
    'POST /v1/runtimes/runtime_1/human-actions/cancel',
  ]);
  assert.deepEqual(server.requests[0]?.body, {
    message: 'Please review checkout before purchase.',
    timeoutSeconds: 3600,
  });
  assert.deepEqual(server.requests[2]?.body, { timeoutSeconds: 30 });
});

test('proxy helpers use flattened v1 proxy routes and nested pool catalog', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const listed = await client.proxies.list({ limit: 25 });
  const created = await client.proxies.create({
    type: 'custom',
    name: 'Datacenter',
    url: 'http://agent:secret@proxy.example.com:8080',
  });
  const staticProxy = await client.proxies.create({
    type: 'managed-static',
    poolId: 'us-tickets',
    autoRenew: true,
  });
  const fetched = await client.proxies.get(created.id);
  const updated = await client.proxies.update(fetched.id, { port: 9090, password: null });
  const testResult = await client.proxies.test(updated.id);
  const deleted = await client.proxies.delete(updated.id);
  const pools = await client.proxies.pools.list({ country: 'US', available: true });
  const pool = await client.proxies.pools.get('us-tickets');

  assert.equal(listed.data[0]?.id, 'proxy_1');
  assert.equal(created.type, 'custom');
  assert.equal(staticProxy.type, 'managed-static');
  assert.equal(staticProxy.poolId, 'us-tickets');
  assert.equal(updated.type, 'custom');
  assert.equal(testResult.exitIp, '198.51.100.24');
  assert.deepEqual(deleted, { id: 'proxy_1', deleted: true });
  assert.equal(pools.data[0]?.id, 'us-tickets');
  assert.equal(pool.id, 'us-tickets');

  assert.deepEqual(paths(server.requests), [
    'GET /v1/proxies?limit=25',
    'POST /v1/proxies',
    'POST /v1/proxies',
    'GET /v1/proxies/proxy_1',
    'PATCH /v1/proxies/proxy_1',
    'POST /v1/proxies/proxy_1/test',
    'DELETE /v1/proxies/proxy_1',
    'GET /v1/proxies/pools?country=US&available=true',
    'GET /v1/proxies/pools/us-tickets',
  ]);
  assert.deepEqual(server.requests[1]?.body, {
    type: 'custom',
    name: 'Datacenter',
    url: 'http://agent:secret@proxy.example.com:8080',
  });
  assert.deepEqual(server.requests[2]?.body, {
    type: 'managed-static',
    poolId: 'us-tickets',
    autoRenew: true,
  });
  assert.deepEqual(server.requests[4]?.body, { port: 9090, password: null });
});

test('runtime invocation helpers build provider request bodies', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });
  const runtime = await client.runtimes.get('runtime_1');

  await client.runtimes.invocations.stagehand.extract(runtime.id, {
    instruction: 'Extract the title',
    schema: {
      toJSONSchema: () => ({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
        required: ['title'],
      }),
    },
  });
  await client.runtimes.invocations.stagehand.act(runtime.id, {
    instruction: 'Click the submit button',
    timeoutSeconds: 5,
  });
  await client.runtimes.invocations.stagehand.agent(runtime.id, {
    instruction: 'Log into the site',
    maxSteps: 5,
    timeoutSeconds: 30,
    variables: {
      username: 'john@example.com',
      password: {
        value: 'secret123',
        description: 'Login password',
      },
      rememberMe: true,
    },
    model: {
      model: 'openai/gpt-5-mini',
      auth: { credential: 'ai_conn_1' },
    },
    highlightCursor: false,
  });
  await client.runtimes.invocations.browserUse.agent(runtime.id, {
    instruction: 'Find the page title',
    maxSteps: 8,
    model: {
      model: 'openai/gpt-5',
      auth: { credential: 'ai_conn_2' },
    },
    useVision: 'auto',
    stepTimeoutSeconds: 15,
  });

  assert.deepEqual(paths(server.requests), [
    'GET /v1/runtimes/runtime_1',
    'POST /v1/runtimes/runtime_1/invocations',
    'POST /v1/runtimes/runtime_1/invocations',
    'POST /v1/runtimes/runtime_1/invocations',
    'POST /v1/runtimes/runtime_1/invocations',
  ]);
  assert.deepEqual(server.requests[1]?.body, {
    action: 'extract',
    instruction: 'Extract the title',
    outputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
      required: ['title'],
    },
  });
  assert.deepEqual(server.requests[2]?.body, {
    action: 'act',
    instruction: 'Click the submit button',
    timeoutSeconds: 5,
  });
  assert.deepEqual(server.requests[3]?.body, {
    action: 'stagehandAgent',
    instruction: 'Log into the site',
    maxSteps: 5,
    timeoutSeconds: 30,
    variables: {
      username: 'john@example.com',
      password: {
        value: 'secret123',
        description: 'Login password',
      },
      rememberMe: true,
    },
    model: {
      model: 'openai/gpt-5-mini',
      auth: { credential: 'ai_conn_1' },
    },
    highlightCursor: false,
  });
  assert.deepEqual(server.requests[4]?.body, {
    action: 'browserUse',
    instruction: 'Find the page title',
    maxSteps: 8,
    model: {
      model: 'openai/gpt-5',
      auth: { credential: 'ai_conn_2' },
    },
    useVision: 'auto',
    stepTimeoutSeconds: 15,
  });
});

test('runtime invocations accept Zod schemas and createAndWait loops until completion', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const invocation = await client.runtimes.invocations.createAndWait(
    'runtime_1',
    {
      action: 'extract',
      instruction: 'Extract invoice details',
      schema: z.object({
        invoiceNumber: z.string(),
        total: z.number(),
      }),
    },
    { timeoutSeconds: 5, pollTimeoutSeconds: 1 }
  );

  assert.equal(invocation.id, 'invocation_1');
  assert.equal(invocation.status, 'succeeded');
  assert.deepEqual(paths(server.requests), [
    'POST /v1/runtimes/runtime_1/invocations',
    'POST /v1/runtimes/runtime_1/invocations/invocation_1/wait',
    'POST /v1/runtimes/runtime_1/invocations/invocation_1/wait',
  ]);
  assert.deepEqual(server.requests[0]?.body, {
    action: 'extract',
    instruction: 'Extract invoice details',
    outputSchema: {
      type: 'object',
      properties: {
        invoiceNumber: { type: 'string' },
        total: { type: 'number' },
      },
      required: ['invoiceNumber', 'total'],
      additionalProperties: false,
    },
  });
});

test('invocation live control is runtime-scoped; observability reads are run-scoped', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  // Live control: wait/cancel resolve to the runtime that owns the invocation.
  const invocation = await client.runtimes.invocations.create('runtime_1', {
    action: 'act',
    instruction: 'click the button',
  });
  assert.equal(invocation.runtimeId, 'runtime_1');
  assert.equal(invocation.runId, 'run_1');

  const waited = await client.runtimes.invocations.wait(invocation.runtimeId, invocation.id, {
    timeoutSeconds: 1,
  });
  assert.equal(waited.waitStatus, 'timeout');
  const cancelled = await client.runtimes.invocations.cancel(invocation.runtimeId, invocation.id);
  assert.equal(cancelled.status, 'cancelling');

  // Observability: list/get are read under the run that produced them.
  const run = await client.runs.get('run_1');
  const list = await client.runs.invocations.list(run.id);
  assert.equal(list.data[0]?.id, 'invocation_1');
  assert.equal(list.data[0]?.status, 'succeeded');
  const fetched = await client.runs.invocations.get(run.id, 'invocation_1');
  assert.equal(fetched.id, 'invocation_1');

  assert.deepEqual(paths(server.requests), [
    'POST /v1/runtimes/runtime_1/invocations',
    'POST /v1/runtimes/runtime_1/invocations/invocation_1/wait',
    'POST /v1/runtimes/runtime_1/invocations/invocation_1/cancel',
    'GET /v1/runs/run_1',
    'GET /v1/runs/run_1/invocations',
    'GET /v1/runs/run_1/invocations/invocation_1',
  ]);
});

test('hosted tools are created and versioned under tools routes', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  const tool = await client.tools.create({
    spaceId: 'space_1',
    type: 'hosted',
    name: 'normalize_price',
    description: 'Normalize prices',
    source: 'export default async function handler(ctx) { return { output: ctx.input }; }',
    inputSchema: {
      type: 'object',
      properties: { price: { type: 'number' } },
      required: ['price'],
    },
    outputSchema: {
      type: 'object',
      properties: { cents: { type: 'integer' } },
      required: ['cents'],
    },
    timeoutSeconds: 12,
    env: { FEATURE_FLAG: 'on' },
  });
  const version = await client.tools.createVersion(tool.id, {
    source: 'export default async function handler(ctx) { return { output: ctx.input }; }',
    timeoutSeconds: 12,
    env: { FEATURE_FLAG: 'on' },
  });

  assert.equal(tool.id, 'tool_1');
  assert.equal(tool.currentVersionId, 'hosted_fn_version_1');
  assert.equal(version.id, 'hosted_fn_version_2');
  assert.deepEqual(paths(server.requests), ['POST /v1/tools', 'POST /v1/tools/tool_1/versions']);
  assert.deepEqual(server.requests[0]?.body, {
    spaceId: 'space_1',
    type: 'hosted',
    name: 'normalize_price',
    description: 'Normalize prices',
    source: 'export default async function handler(ctx) { return { output: ctx.input }; }',
    inputSchema: {
      type: 'object',
      properties: { price: { type: 'number' } },
      required: ['price'],
    },
    outputSchema: {
      type: 'object',
      properties: { cents: { type: 'integer' } },
      required: ['cents'],
    },
    timeoutSeconds: 12,
    env: { FEATURE_FLAG: 'on' },
  });
  assert.deepEqual(server.requests[1]?.body, {
    source: 'export default async function handler(ctx) { return { output: ctx.input }; }',
    timeoutSeconds: 12,
    env: { FEATURE_FLAG: 'on' },
  });
});

test('v1 error shape maps into SDK errors', async () => {
  assert(server);
  const client = new Bctrl({ apiKey: 'test_key', baseUrl: server.baseUrl });

  await assert.rejects(
    () => client.runtimes.get('missing'),
    (error: unknown) => {
      assert(error instanceof BctrlNotFoundError);
      assert.equal(error.message, 'Runtime not found');
      assert.equal(error.code, 'runtime.not_found');
      assert.equal(error.status, 404);
      assert.equal(error.requestId, 'req_123');
      return true;
    }
  );
});

function runtimeTargetFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'target_1',
    runtimeId: 'runtime_1',
    type: 'browser_page',
    label: 'Page 1',
    uri: 'https://example.test/',
    active: true,
    metadata: {
      title: 'Example',
    },
    ...overrides,
  };
}

async function createMockServer(): Promise<MockServer> {
  const requests: RecordedRequest[] = [];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const body = await readJson(req);
    const method = req.method ?? 'GET';
    const path = `${url.pathname}${url.search}`;
    requests.push({ method, path, headers: req.headers, body });

    if (method === 'POST' && url.pathname === '/v1/spaces') {
      return json(res, 201, {
        id: 'space_1',
        name: bodyField(body, 'name') ?? 'sdk-v1',
        createdAt: iso(),
        updatedAt: iso(),
      });
    }

    if (method === 'GET' && url.pathname === '/v1/help') {
      return json(res, 200, {
        kind: 'topic',
        topic: url.searchParams.get('topic') ?? 'runtimes.create',
        audience: url.searchParams.get('audience') ?? undefined,
        title: 'Create a runtime',
        summary: 'Create a browser runtime definition.',
        api: {
          method: 'POST',
          path: '/v1/runtimes',
          operationId: 'runtimes.create',
        },
      });
    }

    if (method === 'GET' && url.pathname === '/v1/auth/whoami') {
      return json(res, 200, {
        email: 'agent@example.com',
        scope: 'organization',
        organizationId: 'org_1',
        subaccountId: null,
        defaultSpaceId: 'space_1',
        plan: 'developer',
        keyId: 'key_1',
      });
    }

    if (method === 'GET' && url.pathname === '/v1/usage') {
      return json(res, 200, {
        organizationId: 'org_1',
        isBlocked: false,
        blockedReasons: [],
        cycle: { startedAt: iso(), endsAt: null },
        credits: {
          monthlyLimit: 1000,
          monthlyUsed: 10,
          monthlyRemaining: 990,
          purchasedRemaining: 0,
          available: 990,
          outstandingDebt: 0,
          effectiveBalance: 990,
          breakdown: {},
        },
        computedAt: iso(),
      });
    }

    if (method === 'POST' && url.pathname === '/v1/api-keys') {
      return json(res, 201, {
        data: {
          id: 'key_1',
          keyKind: 'organization',
          subaccountId: null,
          name: bodyField(body, 'name'),
          keyPrefix: 'bctrl_123',
          scopes: ['*'],
          expiresAt: null,
          createdAt: iso(),
          updatedAt: iso(),
          lastUsedAt: null,
          usageCount: 0,
        },
        secret: 'bctrl_secret',
      });
    }

    if (method === 'POST' && url.pathname === '/v1/subaccounts') {
      return json(res, 201, {
        id: 'sub_1',
        name: bodyField(body, 'name') ?? 'Customer A',
        status: 'active',
        externalId: null,
        metadata: null,
        archivedAt: null,
        defaultSpaceId: 'space_1',
        limits: {},
        createdAt: iso(),
        updatedAt: iso(),
      });
    }

    if (method === 'POST' && url.pathname === '/v1/ai/credentials') {
      return json(res, 201, {
        id: 'ai_1',
        name: bodyField(body, 'name') ?? 'OpenAI',
        provider: bodyField(body, 'provider') ?? 'openai',
        status: 'enabled',
        hasApiKey: true,
        createdAt: iso(),
        updatedAt: iso(),
      });
    }

    if (method === 'GET' && url.pathname === '/v1/ai/models') {
      return json(res, 200, {
        data: [
          {
            id: 'openai/gpt-5',
            provider: 'openai',
            displayName: 'GPT-5',
            managed: true,
            status: 'recommended',
            engines: ['stagehand', 'browserUse'],
            supportsTools: true,
            supportsVision: true,
            supportsStructuredOutput: true,
            supportsReasoningEffort: true,
            supportsThinkingBudget: false,
          },
        ],
      });
    }

    if (method === 'POST' && url.pathname === '/v1/toolsets') {
      return json(res, 201, {
        id: 'toolset_1',
        spaceId: 'space_1',
        name: bodyField(body, 'name') ?? 'browser_tools',
        builtins: bodyField(body, 'builtins') ?? [],
        toolIds: [],
        metadata: null,
        createdAt: iso(),
        updatedAt: iso(),
      });
    }

    if (method === 'GET' && url.pathname === '/v1/tool-calls') {
      return json(res, 200, {
        data: [
          {
            id: 'tool_call_row_1',
            toolCallId: 'call_1',
            spaceId: 'space_1',
            tool: { id: 'tool_1', name: 'normalize_price', type: 'hosted' },
            actor: 'test',
            status: 'succeeded',
            startedAt: iso(),
            finishedAt: iso(),
            durationSeconds: 0.012,
            createdAt: iso(),
          },
        ],
        nextCursor: null,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes') {
      assert.equal(bodyField(body, 'spaceId'), 'space_1');
      return json(res, 201, runtimeFixture({ status: 'stopped', activeRunId: null }));
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/start') {
      return json(res, 200, {
        runtimeId: 'runtime_1',
        runId: 'run_1',
        status: 'active',
        connectUrl: 'wss://example.test/devtools',
        protocol: 'cdp',
        started: true,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/invocations') {
      return json(res, 202, {
        id: 'invocation_1',
        runId: 'run_1',
        runtimeId: 'runtime_1',
        action: 'act',
        status: 'queued',
        error: null,
        createdAt: iso(),
      });
    }

    if (method === 'GET' && url.pathname === '/v1/runtimes/runtime_1') {
      return json(res, 200, runtimeFixture());
    }

    if (method === 'GET' && url.pathname === '/v1/runtimes/runtime_1/targets') {
      return json(res, 200, {
        data: [runtimeTargetFixture()],
        nextCursor: null,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/targets') {
      return json(
        res,
        201,
        runtimeTargetFixture({
          uri: String(bodyField(body, 'uri') ?? 'about:blank'),
          active: bodyField(body, 'activate') === true,
        })
      );
    }

    if (method === 'GET' && url.pathname === '/v1/runtimes/runtime_1/targets/target_1') {
      return json(res, 200, runtimeTargetFixture());
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/targets/target_1/activate') {
      return json(res, 200, runtimeTargetFixture({ active: true }));
    }

    if (method === 'DELETE' && url.pathname === '/v1/runtimes/runtime_1/targets/target_1') {
      return json(res, 200, { id: 'target_1', deleted: true });
    }

    if (method === 'GET' && url.pathname === '/v1/notification-recipients') {
      return json(res, 200, {
        data: [notificationRecipientFixture()],
        nextCursor: null,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/notification-recipients') {
      return json(
        res,
        201,
        notificationRecipientFixture({
          type: bodyField(body, 'type'),
          value: bodyField(body, 'value'),
          name: bodyField(body, 'name') ?? null,
        })
      );
    }

    if (method === 'PATCH' && url.pathname === '/v1/notification-recipients/recipient_1') {
      return json(
        res,
        200,
        notificationRecipientFixture({
          enabled: bodyField(body, 'enabled') ?? true,
          name: bodyField(body, 'name') ?? 'Ops',
        })
      );
    }

    if (method === 'DELETE' && url.pathname === '/v1/notification-recipients/recipient_1') {
      return json(res, 200, { id: 'recipient_1', deleted: true });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/human-actions') {
      return json(
        res,
        201,
        humanActionFixture({
          message: bodyField(body, 'message'),
          expiresAt: '2026-05-16T01:00:00.000Z',
        })
      );
    }

    if (method === 'GET' && url.pathname === '/v1/runtimes/runtime_1/human-actions') {
      return json(res, 200, humanActionFixture());
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/human-actions/wait') {
      return json(res, 200, {
        ...humanActionFixture(),
        waitStatus: 'timeout',
        retryAfterSeconds: 0,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/human-actions/complete') {
      return json(res, 200, humanActionFixture({ status: 'completed', completedAt: iso() }));
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/human-actions/cancel') {
      return json(res, 200, humanActionFixture({ status: 'cancelled', cancelledAt: iso() }));
    }

    if (method === 'GET' && url.pathname === '/v1/runtimes/missing') {
      return json(
        res,
        404,
        {
          error: 'Runtime not found',
          code: 'runtime.not_found',
          requestId: 'req_123',
        },
        { 'x-request-id': 'fallback_req' }
      );
    }

    if (method === 'GET' && url.pathname === '/v1/runs/run_1') {
      return json(res, 200, runFixture());
    }

    if (method === 'GET' && url.pathname === '/v1/runs/run_1/files') {
      return json(res, 200, { data: [fileFixture()], nextCursor: null });
    }

    if (method === 'GET' && url.pathname === '/v1/files') {
      return json(res, 200, { data: [fileFixture()], nextCursor: null });
    }

    if (method === 'GET' && url.pathname === '/v1/browser-extensions') {
      return json(res, 200, { data: [browserExtensionFixture()], nextCursor: null });
    }

    if (method === 'POST' && url.pathname === '/v1/browser-extensions/upload') {
      return json(res, 201, browserExtensionFixture({ name: 'Wallet' }));
    }

    if (method === 'POST' && url.pathname === '/v1/browser-extensions/import') {
      return json(
        res,
        201,
        browserExtensionFixture({
          id: 'ext_imported',
          name: 'Wallet import',
          sourceUrl:
            'https://chromewebstore.google.com/detail/wallet/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        })
      );
    }

    if (method === 'GET' && url.pathname === '/v1/browser-extensions/ext_1') {
      return json(res, 200, browserExtensionFixture());
    }

    if (method === 'PATCH' && url.pathname === '/v1/browser-extensions/ext_1') {
      return json(res, 200, browserExtensionFixture({ name: String(bodyField(body, 'name')) }));
    }

    if (method === 'DELETE' && url.pathname === '/v1/browser-extensions/ext_1') {
      return json(res, 200, { id: 'ext_1', deleted: true });
    }

    if (method === 'GET' && url.pathname === '/v1/proxies') {
      return json(res, 200, { data: [proxyFixture()], nextCursor: null });
    }

    if (method === 'POST' && url.pathname === '/v1/proxies') {
      if (bodyField(body, 'type') === 'managed-static') {
        return json(res, 201, managedStaticProxyFixture());
      }
      return json(res, 201, proxyFixture());
    }

    if (method === 'GET' && url.pathname === '/v1/proxies/proxy_1') {
      return json(res, 200, proxyFixture());
    }

    if (method === 'PATCH' && url.pathname === '/v1/proxies/proxy_1') {
      return json(res, 200, proxyFixture({ port: 9090, hasPassword: false }));
    }

    if (method === 'POST' && url.pathname === '/v1/proxies/proxy_1/test') {
      return json(res, 200, {
        ok: true,
        latencySeconds: 0.421,
        httpStatus: 200,
        exitIp: '198.51.100.24',
        country: 'DE',
      });
    }

    if (method === 'DELETE' && url.pathname === '/v1/proxies/proxy_1') {
      return json(res, 200, { id: 'proxy_1', deleted: true });
    }

    if (method === 'GET' && url.pathname === '/v1/proxies/pools') {
      return json(res, 200, { data: [proxyPoolFixture()], nextCursor: null });
    }

    if (method === 'GET' && url.pathname === '/v1/proxies/pools/us-tickets') {
      return json(res, 200, proxyPoolFixture());
    }

    if (method === 'POST' && url.pathname === '/v1/tools') {
      assert.equal(bodyField(body, 'spaceId'), 'space_1');
      assert.equal(bodyField(body, 'type'), 'hosted');
      assert.equal(bodyField(body, 'name'), 'normalize_price');
      assert.equal(bodyField(body, 'timeoutSeconds'), 12);
      assert.deepEqual(bodyField(body, 'env'), { FEATURE_FLAG: 'on' });
      return json(res, 200, toolFixture());
    }

    if (method === 'POST' && url.pathname === '/v1/tools/tool_1/versions') {
      assert.equal(bodyField(body, 'spaceId'), undefined);
      assert.equal(bodyField(body, 'timeoutSeconds'), 12);
      assert.deepEqual(bodyField(body, 'env'), { FEATURE_FLAG: 'on' });
      return json(res, 200, toolVersionFixture({ id: 'hosted_fn_version_2', version: 2 }));
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/files/stage') {
      return json(res, 200, {
        id: 'staged_1',
        runtimeId: 'runtime_1',
        runtimePath: 'inputs/data.json',
        name: 'data.json',
        sizeBytes: 42,
        expiresAt: null,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/files/upload') {
      return json(res, 200, {
        id: 'staged_1',
        runtimeId: 'runtime_1',
        runtimePath: 'inputs/hello.txt',
        name: 'hello.txt',
        sizeBytes: 5,
        expiresAt: null,
      });
    }

    if (method === 'POST' && url.pathname === '/v1/runtimes/runtime_1/files/collect') {
      return json(res, 200, fileFixture());
    }

    if (
      method === 'POST' &&
      url.pathname === '/v1/runtimes/runtime_1/invocations/invocation_1/wait'
    ) {
      const waitCount = requests.filter(
        (request) =>
          request.method === 'POST' &&
          request.path === '/v1/runtimes/runtime_1/invocations/invocation_1/wait'
      ).length;
      if (waitCount > 1) {
        return json(res, 200, {
          ...invocationFixture({ action: 'extract', status: 'succeeded', output: { ok: true } }),
          waitStatus: 'completed',
        });
      }
      return json(res, 200, {
        ...invocationFixture({ status: 'running' }),
        waitStatus: 'timeout',
        retryAfterSeconds: 0,
      });
    }

    if (
      method === 'POST' &&
      url.pathname === '/v1/runtimes/runtime_1/invocations/invocation_1/cancel'
    ) {
      return json(res, 200, invocationFixture({ status: 'cancelling' }));
    }

    if (method === 'GET' && url.pathname === '/v1/runs/run_1/invocations') {
      return json(res, 200, {
        data: [
          {
            id: 'invocation_1',
            runId: 'run_1',
            runtimeId: 'runtime_1',
            action: 'act',
            status: 'succeeded',
            createdAt: iso(),
            finishedAt: iso(),
            durationSeconds: 0.25,
          },
        ],
        nextCursor: null,
      });
    }

    if (method === 'GET' && url.pathname === '/v1/runs/run_1/invocations/invocation_1') {
      return json(res, 200, invocationFixture({ status: 'succeeded' }));
    }

    return json(res, 404, {
      error: `Unhandled test route: ${method} ${url.pathname}`,
      code: 'test.unhandled_route',
      requestId: 'req_unhandled',
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      ),
  };
}
