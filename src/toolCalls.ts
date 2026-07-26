import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  JsonValue,
  V1ListEnvelope,
  V1ToolCall,
  V1ToolCallListQuery,
  V1ToolCallResultQuery,
} from './types.js';

export class V1ToolCallsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ToolCallListQuery = {}): Promise<V1ListEnvelope<V1ToolCall>> {
    return this.http.request('/tool-calls', { query });
  }

  iter(query: V1ToolCallListQuery = {}): AsyncGenerator<V1ToolCall, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(toolCallId: string): Promise<V1ToolCall> {
    return this.http.request(`/tool-calls/${encodeURIComponent(toolCallId)}`);
  }

  cancel(toolCallId: string): Promise<V1ToolCall> {
    return this.http.request(`/tool-calls/${encodeURIComponent(toolCallId)}/cancel`, {
      method: 'POST',
    });
  }

  respond(toolCallId: string, response: JsonValue): Promise<V1ToolCall> {
    return this.http.request(`/tool-calls/${encodeURIComponent(toolCallId)}/respond`, {
      method: 'POST',
      body: response,
    });
  }

  result(
    toolCallId: string,
    query: V1ToolCallResultQuery = {}
  ): Promise<JsonValue | V1ToolCall> {
    return this.http.request(`/tool-calls/${encodeURIComponent(toolCallId)}/result`, { query });
  }
}
