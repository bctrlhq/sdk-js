import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1Browser, V1BrowserCreateRequest, V1BrowserCreateQuery, V1BrowserStartQuery, V1BrowserDeleteResponse, V1BrowserGetQuery,
  V1BrowserListQuery, V1BrowserMutationQuery, V1BrowserRunHistoryQuery,
  V1BrowserStopQuery, V1BrowserStopRequest, V1BrowserUpdateRequest, V1ListEnvelope, V1Run,
} from './types.js';

export class V1BrowsersClient {
  constructor(private readonly http: V1HttpClient) {}

  private path(browserId: string, suffix = ''): string {
    return `/browsers/${encodeURIComponent(browserId)}${suffix}`;
  }

  list(query: V1BrowserListQuery = {}): Promise<V1ListEnvelope<V1Browser>> {
    return this.http.request('/browsers', { query });
  }

  iter(query: V1BrowserListQuery = {}): AsyncGenerator<V1Browser, void, undefined> {
    return iterateV1Pages(query, (page) => this.list(page));
  }

  create(request: V1BrowserCreateRequest = {}, options: V1BrowserCreateQuery & V1IdempotencyOptions = {}): Promise<V1Browser> {
    const { idempotencyKey, ...query } = options;
    return this.http.request('/browsers', {
      method: 'POST', body: request, query, headers: v1IdempotencyHeaders({ idempotencyKey }),
    });
  }

  get(browserId: string, query: V1BrowserGetQuery = {}): Promise<V1Browser> {
    return this.http.request(this.path(browserId), { query });
  }

  update(browserId: string, request: V1BrowserUpdateRequest, query: V1BrowserMutationQuery = {}): Promise<V1Browser> {
    return this.http.request(this.path(browserId), { method: 'PATCH', body: request, query });
  }

  delete(browserId: string, query: V1BrowserMutationQuery = {}): Promise<V1BrowserDeleteResponse> {
    return this.http.request(this.path(browserId), { method: 'DELETE', query });
  }

  start(browserId: string, options: V1BrowserStartQuery & V1IdempotencyOptions = {}): Promise<V1Browser> {
    const { idempotencyKey, ...query } = options;
    return this.http.request(this.path(browserId, '/start'), {
      method: 'POST', body: {}, query, headers: v1IdempotencyHeaders({ idempotencyKey }),
    });
  }

  stop(browserId: string, request: V1BrowserStopRequest = {}, options: V1BrowserStopQuery & V1IdempotencyOptions = {}): Promise<V1Browser> {
    const { idempotencyKey, ...query } = options;
    return this.http.request(this.path(browserId, '/stop'), {
      method: 'POST', body: request, query, headers: v1IdempotencyHeaders({ idempotencyKey }),
    });
  }

  listRuns(browserId: string, query: V1BrowserRunHistoryQuery = {}): Promise<V1ListEnvelope<V1Run>> {
    return this.http.request(this.path(browserId, '/runs'), { query });
  }

  iterRuns(browserId: string, query: V1BrowserRunHistoryQuery = {}): AsyncGenerator<V1Run, void, undefined> {
    return iterateV1Pages(query, (page) => this.listRuns(browserId, page));
  }

  revokeConnections(browserId: string, options: V1BrowserMutationQuery & V1IdempotencyOptions = {}): Promise<V1Browser> {
    const { idempotencyKey, ...query } = options;
    return this.http.request(this.path(browserId, '/connections/revoke'), {
      method: 'POST', body: {}, query, headers: v1IdempotencyHeaders({ idempotencyKey }),
    });
  }
}
