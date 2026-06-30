import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { toOutputSchema, type JsonSchemaLike } from './schemas.js';
import { abortableSleep } from './utils.js';
import type {
  JsonObject,
  V1Invocation,
  V1InvocationResponse,
  V1RuntimeInvocationCreateRequest,
  V1RuntimeInvocationFileInput,
  V1RuntimeInvocationManagedTools,
  V1RuntimeTargetSelector,
  V1InvocationWaitRequest,
  V1InvocationWaitResponse,
  V1AiModelSelection,
} from './types.js';

export type StagehandVariablePrimitive = string | number | boolean;
export type StagehandVariableValue =
  | StagehandVariablePrimitive
  | {
      value: StagehandVariablePrimitive;
      description?: string;
    };
export type StagehandVariables = Record<string, StagehandVariableValue>;

interface RuntimeInvocationCommonOptions {
  target?: V1RuntimeTargetSelector;
  metadata?: JsonObject;
}

interface RuntimeAgentCommonOptions extends RuntimeInvocationCommonOptions {
  toolsetId?: string;
  toolIds?: string[];
  tools?: V1RuntimeInvocationManagedTools;
  files?: V1RuntimeInvocationFileInput[];
  schema?: JsonSchemaLike;
  timeoutSeconds?: number;
}

interface AiSelectionOptions {
  model?: V1AiModelSelection;
  temperature?: number;
}

type StagehandActionInput = Extract<
  V1RuntimeInvocationCreateRequest,
  { action: 'act' }
>['stagehandAction'];

export interface StagehandActOptions extends RuntimeInvocationCommonOptions, AiSelectionOptions {
  instruction: string;
  stagehandAction?: StagehandActionInput;
  timeoutSeconds?: number;
}

export interface StagehandObserveOptions
  extends RuntimeInvocationCommonOptions, AiSelectionOptions {
  instruction: string;
  selector?: string;
  timeoutSeconds?: number;
}

export type StagehandExtractOptions<TSchema extends JsonSchemaLike | undefined = undefined> =
  RuntimeInvocationCommonOptions &
    AiSelectionOptions & {
      instruction?: string;
      selector?: string;
      schema?: TSchema;
      timeoutSeconds?: number;
    };

export interface StagehandAgentOptions extends RuntimeAgentCommonOptions, AiSelectionOptions {
  instruction: string;
  maxSteps?: number;
  variables?: StagehandVariables;
  executionModel?: V1AiModelSelection;
  systemPrompt?: string;
  highlightCursor?: boolean;
}

export interface BrowserUseAgentOptions extends RuntimeAgentCommonOptions, AiSelectionOptions {
  instruction: string;
  maxSteps?: number;
  extractionModel?: V1AiModelSelection;
  fallbackModel?: V1AiModelSelection;
  useVision?: boolean | 'auto';
  visionDetailLevel?: 'low' | 'high' | 'auto';
  flashMode?: boolean;
  enablePlanning?: boolean;
  maxFailures?: number;
  stepTimeoutSeconds?: number;
  maxActionsPerStep?: number;
  maxHistoryItems?: number | null;
  useThinking?: boolean;
  directlyOpenUrl?: boolean;
  includeAttributes?: string[];
  overrideSystemMessage?: string;
  extendSystemMessage?: string;
  sensitiveData?: Record<string, string | Record<string, string>>;
}

type InvocationCreateWithSchema<T extends V1RuntimeInvocationCreateRequest> = Omit<
  T,
  'outputSchema'
> & {
  schema?: JsonSchemaLike;
};

type ExtractInvocationCreateRequest = Extract<
  V1RuntimeInvocationCreateRequest,
  { action: 'extract' }
>;
type StagehandAgentInvocationCreateRequest = Extract<
  V1RuntimeInvocationCreateRequest,
  { action: 'stagehandAgent' }
>;
type BrowserUseInvocationCreateRequest = Extract<
  V1RuntimeInvocationCreateRequest,
  { action: 'browserUse' }
>;
type InvocationCreateSchemaInput =
  | InvocationCreateWithSchema<ExtractInvocationCreateRequest>
  | InvocationCreateWithSchema<StagehandAgentInvocationCreateRequest>
  | InvocationCreateWithSchema<BrowserUseInvocationCreateRequest>;

export type V1RuntimeInvocationCreateInput =
  | Exclude<
      V1RuntimeInvocationCreateRequest,
      | ExtractInvocationCreateRequest
      | StagehandAgentInvocationCreateRequest
      | BrowserUseInvocationCreateRequest
    >
  | InvocationCreateSchemaInput;

export interface V1InvocationWaitOptions extends V1InvocationWaitRequest {
  signal?: AbortSignal;
}

export interface V1InvocationCreateAndWaitOptions extends V1IdempotencyOptions {
  /**
   * Overall client-side wait budget across repeated long-poll requests.
   * The server-side invocation timeout still belongs in the invocation body.
   */
  timeoutSeconds?: number;
  /**
   * Per-request long-poll timeout sent to the wait endpoint.
   */
  pollTimeoutSeconds?: number;
  signal?: AbortSignal;
}

// Live control is runtime-scoped; observability reads are run-scoped.
function runtimeInvocationActionPath(
  runtimeId: string,
  invocationId: string,
  action: string
): string {
  return `/runtimes/${encodeURIComponent(runtimeId)}/invocations/${encodeURIComponent(
    invocationId
  )}/${action}`;
}

function createRuntimeInvocation(
  http: V1HttpClient,
  runtimeId: string,
  request: V1RuntimeInvocationCreateInput,
  options?: V1IdempotencyOptions
): Promise<V1Invocation> {
  return http.request<V1InvocationResponse>(
    `/runtimes/${encodeURIComponent(runtimeId)}/invocations`,
    {
      method: 'POST',
      body: prepareInvocationCreateRequest(request),
      headers: v1IdempotencyHeaders(options),
    }
  );
}

export class V1RuntimeInvocationsNamespaceClient {
  readonly stagehand: V1RuntimeStagehandInvocationsNamespaceClient;
  readonly browserUse: V1RuntimeBrowserUseInvocationsNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.stagehand = new V1RuntimeStagehandInvocationsNamespaceClient(this);
    this.browserUse = new V1RuntimeBrowserUseInvocationsNamespaceClient(this);
  }

  create(
    runtimeId: string,
    request: V1RuntimeInvocationCreateInput,
    options?: V1IdempotencyOptions
  ): Promise<V1Invocation> {
    return createRuntimeInvocation(this.http, runtimeId, request, options);
  }

  wait(
    runtimeId: string,
    invocationId: string,
    request: V1InvocationWaitOptions = {}
  ): Promise<V1InvocationWaitResponse> {
    return new V1RuntimeInvocationsClient(this.http, runtimeId).wait(invocationId, request);
  }

  cancel(runtimeId: string, invocationId: string): Promise<V1Invocation> {
    return new V1RuntimeInvocationsClient(this.http, runtimeId).cancel(invocationId);
  }

  createAndWait(
    runtimeId: string,
    request: V1RuntimeInvocationCreateInput,
    options: V1InvocationCreateAndWaitOptions = {}
  ): Promise<V1Invocation> {
    return new V1RuntimeInvocationsClient(this.http, runtimeId).createAndWait(request, options);
  }
}

class V1RuntimeInvocationsClient {
  readonly stagehand: V1RuntimeStagehandInvocationsClient;
  readonly browserUse: V1RuntimeBrowserUseInvocationsClient;

  constructor(
    private readonly http: V1HttpClient,
    private readonly runtimeId: string
  ) {
    this.stagehand = new V1RuntimeStagehandInvocationsClient(this);
    this.browserUse = new V1RuntimeBrowserUseInvocationsClient(this);
  }

  async create(
    request: V1RuntimeInvocationCreateInput,
    options?: V1IdempotencyOptions
  ): Promise<V1Invocation> {
    return createRuntimeInvocation(this.http, this.runtimeId, request, options);
  }

  wait(
    invocationId: string,
    request: V1InvocationWaitOptions = {}
  ): Promise<V1InvocationWaitResponse> {
    const { signal, ...body } = request;
    return this.http.request<V1InvocationWaitResponse>(
      runtimeInvocationActionPath(this.runtimeId, invocationId, 'wait'),
      {
        method: 'POST',
        body,
        signal,
      }
    );
  }

  cancel(invocationId: string): Promise<V1Invocation> {
    return this.http.request<V1InvocationResponse>(
      runtimeInvocationActionPath(this.runtimeId, invocationId, 'cancel'),
      {
        method: 'POST',
      }
    );
  }

  async createAndWait(
    request: V1RuntimeInvocationCreateInput,
    options: V1InvocationCreateAndWaitOptions = {}
  ): Promise<V1Invocation> {
    const invocation = await this.create(request, options);
    return waitForInvocation(this, invocation.id, options);
  }
}

class V1RuntimeStagehandInvocationsClient {
  constructor(private readonly invocations: V1RuntimeInvocationsClient) {}

  act(options: StagehandActOptions): Promise<V1Invocation> {
    return this.invocations.create({
      action: 'act',
      ...options,
    });
  }

  observe(options: StagehandObserveOptions): Promise<V1Invocation> {
    return this.invocations.create({
      action: 'observe',
      ...options,
    });
  }

  extract<TSchema extends JsonSchemaLike | undefined = undefined>(
    options: StagehandExtractOptions<TSchema>
  ): Promise<V1Invocation> {
    const { schema, ...common } = options;
    return this.invocations.create({
      action: 'extract',
      ...common,
      ...(schema !== undefined
        ? { outputSchema: toOutputSchema(schema, 'Stagehand extract schema') }
        : {}),
    });
  }

  agent(options: StagehandAgentOptions): Promise<V1Invocation> {
    return this.invocations.create({
      action: 'stagehandAgent',
      ...options,
    });
  }
}

class V1RuntimeBrowserUseInvocationsClient {
  constructor(private readonly invocations: V1RuntimeInvocationsClient) {}

  agent(options: BrowserUseAgentOptions): Promise<V1Invocation> {
    return this.invocations.create({
      action: 'browserUse',
      ...options,
    });
  }
}

export class V1RuntimeStagehandInvocationsNamespaceClient {
  constructor(private readonly invocations: V1RuntimeInvocationsNamespaceClient) {}

  act(runtimeId: string, options: StagehandActOptions): Promise<V1Invocation> {
    return this.invocations.create(runtimeId, {
      action: 'act',
      ...options,
    });
  }

  observe(runtimeId: string, options: StagehandObserveOptions): Promise<V1Invocation> {
    return this.invocations.create(runtimeId, {
      action: 'observe',
      ...options,
    });
  }

  extract<TSchema extends JsonSchemaLike | undefined = undefined>(
    runtimeId: string,
    options: StagehandExtractOptions<TSchema>
  ): Promise<V1Invocation> {
    const { schema, ...common } = options;
    return this.invocations.create(runtimeId, {
      action: 'extract',
      ...common,
      ...(schema !== undefined
        ? { outputSchema: toOutputSchema(schema, 'Stagehand extract schema') }
        : {}),
    });
  }

  agent(runtimeId: string, options: StagehandAgentOptions): Promise<V1Invocation> {
    return this.invocations.create(runtimeId, {
      action: 'stagehandAgent',
      ...options,
    });
  }
}

export class V1RuntimeBrowserUseInvocationsNamespaceClient {
  constructor(private readonly invocations: V1RuntimeInvocationsNamespaceClient) {}

  agent(runtimeId: string, options: BrowserUseAgentOptions): Promise<V1Invocation> {
    return this.invocations.create(runtimeId, {
      action: 'browserUse',
      ...options,
    });
  }
}

function prepareInvocationCreateRequest(
  request: V1RuntimeInvocationCreateInput
): V1RuntimeInvocationCreateRequest {
  if (!hasInvocationSchema(request)) {
    return request;
  }

  const { schema, ...body } = request;
  return {
    ...body,
    outputSchema: toOutputSchema(schema, 'Invocation schema'),
  };
}

function hasInvocationSchema(
  request: V1RuntimeInvocationCreateInput
): request is InvocationCreateSchemaInput & { schema: JsonSchemaLike } {
  return 'schema' in request && request.schema !== undefined;
}

async function waitForInvocation(
  client: V1RuntimeInvocationsClient,
  invocationId: string,
  options: V1InvocationCreateAndWaitOptions
): Promise<V1Invocation> {
  const deadline =
    options.timeoutSeconds === undefined ? undefined : Date.now() + options.timeoutSeconds * 1000;

  for (;;) {
    if (deadline !== undefined && Date.now() >= deadline) {
      throw new Error(`Invocation ${invocationId} did not finish before timeout`);
    }

    const remainingMs = deadline === undefined ? undefined : Math.max(1, deadline - Date.now());
    const remainingSeconds =
      remainingMs === undefined ? undefined : Math.max(1, Math.ceil(remainingMs / 1000));
    const timeoutSeconds =
      options.pollTimeoutSeconds === undefined
        ? remainingSeconds
        : remainingSeconds === undefined
          ? options.pollTimeoutSeconds
          : Math.min(options.pollTimeoutSeconds, remainingSeconds);

    const result = await client.wait(invocationId, {
      ...(timeoutSeconds === undefined ? {} : { timeoutSeconds }),
      signal: options.signal,
    });
    if (result.waitStatus === 'completed') {
      return result;
    }

    const sleepMs =
      deadline === undefined
        ? (result.retryAfterSeconds ?? 1) * 1000
        : Math.min((result.retryAfterSeconds ?? 1) * 1000, Math.max(0, deadline - Date.now()));
    await abortableSleep(sleepMs, options.signal);
  }
}
