import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Runtime,
  V1RuntimeCreateRequest,
  V1RuntimeCreateResponse,
  V1RuntimeDeleteResponse,
  V1RuntimeGetQuery,
  V1RuntimeListQuery,
  V1RuntimeStartResponse,
  V1RuntimeStopResponse,
  V1RuntimeSummary,
  V1RuntimeUpdateRequest,
} from './types.js';

export type V1RuntimeStartResult = V1RuntimeStartResponse;

export class V1RuntimesClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1RuntimeListQuery = {}): Promise<V1ListEnvelope<V1RuntimeSummary>> {
    return this.http.request('/runtimes', { query });
  }

  iter(query: V1RuntimeListQuery = {}): AsyncGenerator<V1RuntimeSummary, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(
    request: V1RuntimeCreateRequest,
    options?: V1IdempotencyOptions
  ): Promise<V1RuntimeCreateResponse> {
    return this.http.request('/runtimes', {
      method: 'POST',
      body: request,
      headers: v1IdempotencyHeaders(options),
    });
  }

  get(runtimeId: string, query: V1RuntimeGetQuery = {}): Promise<V1Runtime> {
    return this.http.request(`/runtimes/${encodeURIComponent(runtimeId)}`, { query });
  }

  update(runtimeId: string, request: V1RuntimeUpdateRequest): Promise<V1Runtime> {
    return this.http.request(`/runtimes/${encodeURIComponent(runtimeId)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(runtimeId: string, options: { force?: boolean } = {}): Promise<V1RuntimeDeleteResponse> {
    return this.http.request(`/runtimes/${encodeURIComponent(runtimeId)}`, {
      method: 'DELETE',
      query: options,
    });
  }

  start(
    runtimeId: string,
    options: V1IdempotencyOptions & { recording?: boolean } = {}
  ): Promise<V1RuntimeStartResponse> {
    const { recording, ...idempotency } = options;
    return this.http.request(`/runtimes/${encodeURIComponent(runtimeId)}/start`, {
      method: 'POST',
      // The gateway contract is a defaulted JSON object. Sending `{}` keeps
      // the no-options form valid as well as the explicit recording form.
      body: recording === undefined ? {} : { recording },
      headers: v1IdempotencyHeaders(idempotency),
    });
  }

  stop(runtimeId: string): Promise<V1RuntimeStopResponse> {
    return this.http.request(`/runtimes/${encodeURIComponent(runtimeId)}/stop`, {
      method: 'POST',
    });
  }
}
