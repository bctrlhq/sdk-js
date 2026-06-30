import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type { V1ListEnvelope, V1ToolCall, V1ToolCallListQuery } from './types.js';

export class V1ToolCallsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ToolCallListQuery = {}): Promise<V1ListEnvelope<V1ToolCall>> {
    return this.http.request<V1ListEnvelope<V1ToolCall>>('/tool-calls', { query });
  }

  iter(query: V1ToolCallListQuery = {}): AsyncGenerator<V1ToolCall, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(toolCallId: string): Promise<V1ToolCall> {
    return this.http.request<V1ToolCall>(`/tool-calls/${encodeURIComponent(toolCallId)}`);
  }
}
