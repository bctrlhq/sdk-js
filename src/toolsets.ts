import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Toolset,
  V1ToolsetCreateRequest,
  V1ToolsetDeleteResponse,
  V1ToolsetListQuery,
  V1ToolsetUpdateRequest,
} from './types.js';

export class V1ToolsetsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ToolsetListQuery = {}): Promise<V1ListEnvelope<V1Toolset>> {
    return this.http.request<V1ListEnvelope<V1Toolset>>('/toolsets', { query });
  }

  iter(query: V1ToolsetListQuery = {}): AsyncGenerator<V1Toolset, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ToolsetCreateRequest): Promise<V1Toolset> {
    return this.http.request<V1Toolset>('/toolsets', {
      method: 'POST',
      body: request,
    });
  }

  get(toolsetId: string): Promise<V1Toolset> {
    return this.http.request<V1Toolset>(`/toolsets/${encodeURIComponent(toolsetId)}`);
  }

  update(toolsetId: string, request: V1ToolsetUpdateRequest): Promise<V1Toolset> {
    return this.http.request<V1Toolset>(`/toolsets/${encodeURIComponent(toolsetId)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(toolsetId: string): Promise<V1ToolsetDeleteResponse> {
    return this.http.request<V1ToolsetDeleteResponse>(
      `/toolsets/${encodeURIComponent(toolsetId)}`,
      { method: 'DELETE' }
    );
  }
}
