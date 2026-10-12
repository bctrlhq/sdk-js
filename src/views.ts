import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1View,
  V1ViewCreateRequest,
  V1ViewCreateResponse,
  V1ViewDeleteResponse,
  V1ViewSession,
  V1ViewSessionCreateRequest,
  V1ViewsListQuery,
} from './types.js';

export class V1ViewsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ViewsListQuery = {}): Promise<V1ListEnvelope<V1View>> {
    return this.http.request<V1ListEnvelope<V1View>>('/views', { query });
  }

  iter(query: V1ViewsListQuery = {}): AsyncGenerator<V1View, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ViewCreateRequest): Promise<V1ViewCreateResponse> {
    return this.http.request<V1ViewCreateResponse>('/views', {
      method: 'POST',
      body: request,
    });
  }

  get(viewId: string): Promise<V1View> {
    return this.http.request<V1View>(`/views/${encodeURIComponent(viewId)}`);
  }

  delete(viewId: string): Promise<V1ViewDeleteResponse> {
    return this.http.request<V1ViewDeleteResponse>(`/views/${encodeURIComponent(viewId)}`, {
      method: 'DELETE',
    });
  }

  createSession(
    viewId: string,
    request: V1ViewSessionCreateRequest,
    viewToken: string
  ): Promise<V1ViewSession> {
    return this.http.request<V1ViewSession>(
      `/views/${encodeURIComponent(viewId)}/sessions`,
      {
        method: 'POST',
        body: request,
        headers: { Authorization: `Bearer ${viewToken}` },
      }
    );
  }
}
