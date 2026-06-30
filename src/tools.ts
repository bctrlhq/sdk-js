import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  JsonObject,
  V1ListEnvelope,
  V1PageQuery,
  V1Tool,
  V1ToolCreateRequest,
  V1ToolUpdateRequest,
  V1ToolVersion,
  V1ToolVersionCreateRequest,
} from './types.js';

export interface V1ToolListQuery extends V1PageQuery {
  spaceId?: string;
}

export type V1ToolVersionListQuery = V1PageQuery;

export class V1ToolsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ToolListQuery = {}): Promise<V1ListEnvelope<V1Tool>> {
    return this.http.request<V1ListEnvelope<V1Tool>>('/tools', { query });
  }

  iter(query: V1ToolListQuery = {}): AsyncGenerator<V1Tool, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ToolCreateRequest): Promise<V1Tool> {
    return this.http.request<V1Tool>('/tools', { method: 'POST', body: request });
  }

  get(id: string): Promise<V1Tool> {
    return this.http.request<V1Tool>(`/tools/${encodeURIComponent(id)}`);
  }

  update(id: string, request: V1ToolUpdateRequest): Promise<V1Tool> {
    return this.http.request<V1Tool>(`/tools/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  test(id: string, request: { input?: unknown } = {}): Promise<unknown> {
    return this.http.request(`/tools/${encodeURIComponent(id)}/test`, {
      method: 'POST',
      body: request,
    });
  }

  listVersions(
    id: string,
    query: V1ToolVersionListQuery = {}
  ): Promise<V1ListEnvelope<V1ToolVersion>> {
    return this.http.request<V1ListEnvelope<V1ToolVersion>>(
      `/tools/${encodeURIComponent(id)}/versions`,
      { query }
    );
  }

  createVersion(id: string, request: V1ToolVersionCreateRequest): Promise<V1ToolVersion> {
    return this.http.request<V1ToolVersion>(`/tools/${encodeURIComponent(id)}/versions`, {
      method: 'POST',
      body: request,
    });
  }

  getVersion(id: string, versionId: string): Promise<V1ToolVersion> {
    return this.http.request<V1ToolVersion>(
      `/tools/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`
    );
  }

  promoteVersion(id: string, versionId: string): Promise<V1ToolVersion> {
    return this.http.request<V1ToolVersion>(
      `/tools/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/promote`,
      { method: 'POST' }
    );
  }
}

export function passthroughJsonSchema(): JsonObject {
  return { type: 'object', additionalProperties: true };
}
