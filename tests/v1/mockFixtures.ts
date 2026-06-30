import http from 'node:http';

export interface RecordedRequest {
  method: string;
  path: string;
  headers: http.IncomingHttpHeaders;
  body: unknown;
}

export function paths(requests: RecordedRequest[]): string[] {
  return requests.map((request) => `${request.method} ${request.path}`);
}

export async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return undefined;
  const contentType = req.headers['content-type'];
  if (typeof contentType === 'string' && !contentType.includes('application/json')) {
    return text;
  }
  return JSON.parse(text) as unknown;
}

export function json(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): void {
  res.writeHead(status, {
    'content-type': 'application/json',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

export function bodyField(body: unknown, key: string): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  return (body as Record<string, unknown>)[key];
}

export function runtimeFixture(overrides: Partial<ReturnType<typeof runtimeFixtureBase>> = {}) {
  return {
    ...runtimeFixtureBase(),
    ...overrides,
  };
}

function runtimeFixtureBase() {
  return {
    id: 'runtime_1',
    spaceId: 'space_1',
    name: 'route-check',
    type: 'browser',
    status: 'active',
    activeRunId: 'run_1',
    lastActivityAt: iso(),
    config: {},
    metadata: { test: true },
    createdAt: iso(),
    updatedAt: iso(),
  };
}

export function runFixture() {
  return {
    id: 'run_1',
    spaceId: 'space_1',
    runtimeId: 'runtime_1',
    runtimeType: 'browser',
    status: 'running',
    createdAt: iso(),
    startedAt: iso(),
    finishedAt: null,
  };
}

export function invocationFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invocation_1',
    runId: 'run_1',
    runtimeId: 'runtime_1',
    action: 'act',
    status: 'queued',
    error: null,
    createdAt: iso(),
    ...overrides,
  };
}

export function humanActionFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'human_action_1',
    runtimeId: 'runtime_1',
    runId: 'run_1',
    invocationId: 'invocation_1',
    status: 'pending',
    message: 'Please review checkout before purchase.',
    requestedBy: 'api',
    createdAt: iso(),
    updatedAt: iso(),
    completedAt: null,
    cancelledAt: null,
    expiresAt: null,
    ...overrides,
  };
}

export function notificationRecipientFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'recipient_1',
    organizationId: 'org_1',
    type: 'email',
    value: 'ops@example.com',
    name: 'Ops',
    enabled: true,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides,
  };
}

export function fileFixture(overrides: Partial<ReturnType<typeof fileFixtureBase>> = {}) {
  return {
    ...fileFixtureBase(),
    ...overrides,
  };
}

function fileFixtureBase() {
  return {
    id: 'file_1',
    type: 'screenshot',
    source: 'runtime',
    name: 'screenshot.png',
    path: '/screenshots/screenshot.png',
    contentType: 'image/png',
    sizeBytes: 42,
    spaceId: 'space_1',
    runtimeId: 'runtime_1',
    runId: 'run_1',
    metadata: null,
    createdAt: iso(),
  };
}

export function browserExtensionFixture(
  overrides: Partial<ReturnType<typeof browserExtensionFixtureBase>> = {}
) {
  return {
    ...browserExtensionFixtureBase(),
    ...overrides,
  };
}

function browserExtensionFixtureBase() {
  return {
    id: 'ext_1',
    name: 'Wallet',
    version: '1.0.0',
    format: 'crx',
    subaccountId: 'sub_1',
    sizeBytes: 1234,
    contentHash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    profileCount: 0,
    createdAt: iso(),
    updatedAt: iso(),
  };
}

export function proxyFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proxy_1',
    name: 'Datacenter',
    type: 'custom',
    protocol: 'http',
    host: 'proxy.example.com',
    port: 8080,
    username: 'agent',
    hasPassword: true,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides,
  };
}

export function managedStaticProxyFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'proxy_static_1',
    name: 'us-tickets',
    type: 'managed-static',
    status: 'provisioning',
    poolId: 'us-tickets',
    autoRenew: true,
    pricing: { priceCredits: 5000, termDays: 30 },
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides,
  };
}

export function proxyPoolFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'us-tickets',
    label: 'US Tickets',
    country: 'US',
    category: 'tickets',
    termDays: 30,
    priceCredits: 5000,
    availableCount: 1,
    ...overrides,
  };
}

export function toolVersionFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hosted_fn_version_1',
    toolId: 'tool_1',
    version: 1,
    source: 'export default async function handler(ctx) { return { output: ctx.input }; }',
    timeoutSeconds: 12,
    env: { FEATURE_FLAG: 'on' },
    metadata: null,
    current: true,
    createdAt: iso(),
    ...overrides,
  };
}

export function toolFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tool_1',
    spaceId: 'space_1',
    name: 'normalize_price',
    description: 'Normalize prices',
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    type: 'hosted',
    currentVersionId: 'hosted_fn_version_1',
    status: 'enabled',
    metadata: null,
    createdAt: iso(),
    updatedAt: iso(),
    ...overrides,
  };
}

export function iso(): string {
  return '2026-05-16T00:00:00.000Z';
}
