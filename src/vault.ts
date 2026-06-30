import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1VaultSecret,
  V1VaultSecretDeleteResponse,
  V1VaultSecretListQuery,
  V1VaultSecretPatchRequest,
  V1VaultSecretUpsertRequest,
  V1VaultSecretValue,
  V1VaultTotpResponse,
} from './types.js';

export class V1VaultClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1VaultSecretListQuery = {}): Promise<V1ListEnvelope<V1VaultSecret>> {
    return this.http.request<V1ListEnvelope<V1VaultSecret>>('/vault/secrets', { query });
  }

  iter(query: V1VaultSecretListQuery = {}): AsyncGenerator<V1VaultSecret, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(key: string): Promise<V1VaultSecret> {
    return this.http.request<V1VaultSecret>(`/vault/secrets/${encodeURIComponent(key)}`);
  }

  value(key: string): Promise<V1VaultSecretValue> {
    return this.http.request<V1VaultSecretValue>(`/vault/secrets/${encodeURIComponent(key)}/value`);
  }

  upsert(key: string, request: V1VaultSecretUpsertRequest): Promise<V1VaultSecret> {
    return this.http.request<V1VaultSecret>(`/vault/secrets/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: request,
    });
  }

  update(key: string, request: V1VaultSecretPatchRequest): Promise<V1VaultSecret> {
    return this.http.request<V1VaultSecret>(`/vault/secrets/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  totp(key: string): Promise<V1VaultTotpResponse> {
    return this.http.request<V1VaultTotpResponse>(`/vault/secrets/${encodeURIComponent(key)}/totp`);
  }

  delete(key: string): Promise<V1VaultSecretDeleteResponse> {
    return this.http.request<V1VaultSecretDeleteResponse>(
      `/vault/secrets/${encodeURIComponent(key)}`,
      { method: 'DELETE' }
    );
  }
}
