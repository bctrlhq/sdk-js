import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type { V1Agent, V1AgentListQuery, V1ListEnvelope } from './types.js';

export class V1AgentsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1AgentListQuery = {}): Promise<V1ListEnvelope<V1Agent>> {
    return this.http.request('/agents', { query });
  }

  iter(query: V1AgentListQuery = {}): AsyncGenerator<V1Agent, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }
}
