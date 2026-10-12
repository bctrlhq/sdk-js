import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1AiCredential,
  V1AiCredentialCreateRequest,
  V1AiCredentialDeleteResponse,
  V1AiCredentialListQuery,
  V1AiCredentialTestResponse,
  V1AiCredentialUpdateRequest,
  V1AiModel,
  V1AiModelListQuery,
  V1AiModelListResponse,
  V1ListEnvelope,
} from './types.js';

export class V1AiModelsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1AiModelListQuery = {}): Promise<V1AiModelListResponse> {
    return this.http.request<V1AiModelListResponse>('/ai/models', { query });
  }
}

export class V1AiCredentialsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1AiCredentialListQuery = {}): Promise<V1ListEnvelope<V1AiCredential>> {
    return this.http.request<V1ListEnvelope<V1AiCredential>>('/ai/credentials', { query });
  }

  iter(query: V1AiCredentialListQuery = {}): AsyncGenerator<V1AiCredential, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1AiCredentialCreateRequest): Promise<V1AiCredential> {
    return this.http.request<V1AiCredential>('/ai/credentials', {
      method: 'POST',
      body: request,
    });
  }

  get(credentialId: string): Promise<V1AiCredential> {
    return this.http.request<V1AiCredential>(
      `/ai/credentials/${encodeURIComponent(credentialId)}`
    );
  }

  update(credentialId: string, request: V1AiCredentialUpdateRequest): Promise<V1AiCredential> {
    return this.http.request<V1AiCredential>(
      `/ai/credentials/${encodeURIComponent(credentialId)}`,
      {
        method: 'PATCH',
        body: request,
      }
    );
  }

  delete(credentialId: string): Promise<V1AiCredentialDeleteResponse> {
    return this.http.request<V1AiCredentialDeleteResponse>(
      `/ai/credentials/${encodeURIComponent(credentialId)}`,
      { method: 'DELETE' }
    );
  }

  test(credentialId: string): Promise<V1AiCredentialTestResponse> {
    return this.http.request<V1AiCredentialTestResponse>(
      `/ai/credentials/${encodeURIComponent(credentialId)}/test`,
      { method: 'POST' }
    );
  }
}

export class V1AiClient {
  readonly models: V1AiModelsClient;
  readonly credentials: V1AiCredentialsClient;

  constructor(http: V1HttpClient) {
    this.models = new V1AiModelsClient(http);
    this.credentials = new V1AiCredentialsClient(http);
  }
}
