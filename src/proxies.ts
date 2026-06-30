import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Proxy,
  V1ProxyCreateRequest,
  V1ProxyDeleteResponse,
  V1ProxyListQuery,
  V1ProxyPool,
  V1ProxyPoolListQuery,
  V1ProxyTestResponse,
  V1ProxyUpdateRequest,
} from './types.js';

export class V1ProxyPoolsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ProxyPoolListQuery = {}): Promise<V1ListEnvelope<V1ProxyPool>> {
    return this.http.request<V1ListEnvelope<V1ProxyPool>>('/proxies/pools', { query });
  }

  iter(query: V1ProxyPoolListQuery = {}): AsyncGenerator<V1ProxyPool, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(poolId: string): Promise<V1ProxyPool> {
    return this.http.request<V1ProxyPool>(`/proxies/pools/${encodeURIComponent(poolId)}`);
  }
}

export class V1ProxiesClient {
  readonly pools: V1ProxyPoolsClient;

  constructor(private readonly http: V1HttpClient) {
    this.pools = new V1ProxyPoolsClient(http);
  }

  list(query: V1ProxyListQuery = {}): Promise<V1ListEnvelope<V1Proxy>> {
    return this.http.request<V1ListEnvelope<V1Proxy>>('/proxies', { query });
  }

  iter(query: V1ProxyListQuery = {}): AsyncGenerator<V1Proxy, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ProxyCreateRequest): Promise<V1Proxy> {
    return this.http.request<V1Proxy>('/proxies', {
      method: 'POST',
      body: request,
    });
  }

  get(proxyId: string): Promise<V1Proxy> {
    return this.http.request<V1Proxy>(`/proxies/${encodeURIComponent(proxyId)}`);
  }

  update(proxyId: string, request: V1ProxyUpdateRequest): Promise<V1Proxy> {
    return this.http.request<V1Proxy>(`/proxies/${encodeURIComponent(proxyId)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  test(proxyId: string): Promise<V1ProxyTestResponse> {
    return this.http.request<V1ProxyTestResponse>(`/proxies/${encodeURIComponent(proxyId)}/test`, {
      method: 'POST',
    });
  }

  delete(proxyId: string): Promise<V1ProxyDeleteResponse> {
    return this.http.request<V1ProxyDeleteResponse>(`/proxies/${encodeURIComponent(proxyId)}`, {
      method: 'DELETE',
    });
  }
}
