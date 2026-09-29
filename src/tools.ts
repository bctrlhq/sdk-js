import {
  v1IdempotencyHeaders,
  type V1HttpClient,
  type V1ToolCallOptions,
  type V1ToolInvocationOptions,
} from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  AsyncBuiltinToolName,
  BuiltinToolInputMap,
  BuiltinToolOutputMap,
  SyncBuiltinToolName,
} from './generated/tool-types.js';
import type {
  JsonObject,
  JsonValue,
  V1ListEnvelope,
  V1Tool,
  V1ToolCall,
  V1ToolCreateRequest,
  V1ToolListQuery,
  V1ToolUpdateRequest,
} from './types.js';

export class V1ToolsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ToolListQuery = {}): Promise<V1ListEnvelope<V1Tool>> {
    return this.http.request('/tools', { query });
  }

  iter(query: V1ToolListQuery = {}): AsyncGenerator<V1Tool, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ToolCreateRequest): Promise<V1Tool> {
    return this.http.request('/tools', { method: 'POST', body: request });
  }

  get(toolRef: string): Promise<V1Tool> {
    return this.http.request(`/tools/${encodeURIComponent(toolRef)}`);
  }

  update(toolRef: string, request: V1ToolUpdateRequest): Promise<V1Tool> {
    return this.http.request(`/tools/${encodeURIComponent(toolRef)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(toolRef: string): Promise<{ id: string; deleted: true }> {
    return this.http.request(`/tools/${encodeURIComponent(toolRef)}`, { method: 'DELETE' });
  }

  /**
   * Call a synchronous Tool and wait for its output. It takes no idempotency
   * key: the output may hold secret or one-time values and is never stored for
   * a replay. Use `start` for a retry-safe call.
   */
  call<Name extends SyncBuiltinToolName>(
    toolRef: Name,
    input: BuiltinToolInputMap[Name],
    options?: V1ToolCallOptions
  ): Promise<BuiltinToolOutputMap[Name]>;
  call(
    toolRef: `tool_${string}`,
    input: JsonObject,
    options?: V1ToolCallOptions
  ): Promise<JsonValue>;
  call(
    toolRef: string,
    input: unknown,
    options?: V1ToolCallOptions
  ): Promise<JsonValue> {
    const headers: Record<string, string> = options?.runtimeId
      ? { 'BCTRL-Runtime-Id': options.runtimeId }
      : {};
    return this.http.request(`/tools/${encodeURIComponent(toolRef)}/call`, {
      method: 'POST',
      body: input,
      headers,
    });
  }

  start<Name extends AsyncBuiltinToolName>(
    toolRef: Name,
    input: BuiltinToolInputMap[Name],
    options?: V1ToolInvocationOptions
  ): Promise<V1ToolCall>;
  start(
    toolRef: `tool_${string}`,
    input: JsonObject,
    options?: V1ToolInvocationOptions
  ): Promise<V1ToolCall>;
  start(
    toolRef: string,
    input: unknown,
    options?: V1ToolInvocationOptions
  ): Promise<V1ToolCall> {
    const headers = {
      ...v1IdempotencyHeaders(options),
      ...(options?.runtimeId ? { 'BCTRL-Runtime-Id': options.runtimeId } : {}),
    };
    return this.http.request(`/tools/${encodeURIComponent(toolRef)}/calls`, {
      method: 'POST',
      body: input,
      headers,
    });
  }
}

export function passthroughJsonSchema(): JsonObject {
  return { type: 'object', additionalProperties: true };
}
