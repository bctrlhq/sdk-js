import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Space,
  V1SpaceCreateRequest,
  V1SpaceDeleteResponse,
  V1SpaceListQuery,
  V1SpaceUpdateRequest,
} from './types.js';

export class V1SpacesClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1SpaceListQuery = {}): Promise<V1ListEnvelope<V1Space>> {
    return this.http.request<V1ListEnvelope<V1Space>>('/spaces', { query });
  }

  iter(query: V1SpaceListQuery = {}): AsyncGenerator<V1Space, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1SpaceCreateRequest): Promise<V1Space> {
    return this.http.request<V1Space>('/spaces', {
      method: 'POST',
      body: request,
    });
  }

  get(id: string): Promise<V1Space> {
    return this.http.request<V1Space>(`/spaces/${encodeURIComponent(id)}`);
  }

  update(id: string, request: V1SpaceUpdateRequest): Promise<V1Space> {
    return this.http.request<V1Space>(`/spaces/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(id: string): Promise<V1SpaceDeleteResponse> {
    return this.http.request<V1SpaceDeleteResponse>(`/spaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
