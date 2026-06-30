import type { V1HttpClient } from './http.js';
import { V1NotificationRecipientsClient } from './notificationRecipients.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1AccountUsage,
  V1ApiKey,
  V1ApiKeyCreateRequest,
  V1ApiKeyCreateResponse,
  V1ApiKeyDeleteResponse,
  V1ApiKeyListQuery,
  V1AuthWhoamiResponse,
  V1ListEnvelope,
  V1Subaccount,
  V1SubaccountArchiveResponse,
  V1SubaccountCreateRequest,
  V1SubaccountGetQuery,
  V1SubaccountListQuery,
  V1SubaccountUpdateRequest,
  V1SubaccountUsage,
  V1SubaccountUsageListQuery,
} from './types.js';

export class V1AuthClient {
  constructor(private readonly http: V1HttpClient) {}

  whoami(): Promise<V1AuthWhoamiResponse> {
    return this.http.request<V1AuthWhoamiResponse>('/auth/whoami');
  }
}

export class V1ApiKeysClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1ApiKeyListQuery = {}): Promise<V1ListEnvelope<V1ApiKey>> {
    return this.http.request<V1ListEnvelope<V1ApiKey>>('/api-keys', { query });
  }

  iter(query: V1ApiKeyListQuery = {}): AsyncGenerator<V1ApiKey, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ApiKeyCreateRequest = {}): Promise<V1ApiKeyCreateResponse> {
    return this.http.request<V1ApiKeyCreateResponse>('/api-keys', {
      method: 'POST',
      body: request,
    });
  }

  delete(keyId: string): Promise<V1ApiKeyDeleteResponse> {
    return this.http.request<V1ApiKeyDeleteResponse>(`/api-keys/${encodeURIComponent(keyId)}`, {
      method: 'DELETE',
    });
  }
}

export class V1SubaccountUsageClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1SubaccountUsageListQuery = {}): Promise<V1ListEnvelope<V1SubaccountUsage>> {
    return this.http.request<V1ListEnvelope<V1SubaccountUsage>>('/subaccounts/usage', {
      query,
    });
  }

  iter(query: V1SubaccountUsageListQuery = {}): AsyncGenerator<V1SubaccountUsage, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }
}

export class V1SubaccountsClient {
  readonly usage: V1SubaccountUsageClient;

  constructor(private readonly http: V1HttpClient) {
    this.usage = new V1SubaccountUsageClient(http);
  }

  list(query: V1SubaccountListQuery = {}): Promise<V1ListEnvelope<V1Subaccount>> {
    return this.http.request<V1ListEnvelope<V1Subaccount>>('/subaccounts', { query });
  }

  iter(query: V1SubaccountListQuery = {}): AsyncGenerator<V1Subaccount, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1SubaccountCreateRequest): Promise<V1Subaccount> {
    return this.http.request<V1Subaccount>('/subaccounts', {
      method: 'POST',
      body: request,
    });
  }

  get(subaccountId: string, query: V1SubaccountGetQuery = {}): Promise<V1Subaccount> {
    return this.http.request<V1Subaccount>(`/subaccounts/${encodeURIComponent(subaccountId)}`, {
      query,
    });
  }

  update(subaccountId: string, request: V1SubaccountUpdateRequest): Promise<V1Subaccount> {
    return this.http.request<V1Subaccount>(`/subaccounts/${encodeURIComponent(subaccountId)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  archive(subaccountId: string): Promise<V1SubaccountArchiveResponse> {
    return this.http.request<V1SubaccountArchiveResponse>(
      `/subaccounts/${encodeURIComponent(subaccountId)}/archive`,
      { method: 'POST' }
    );
  }
}

export class V1UsageClient {
  constructor(private readonly http: V1HttpClient) {}

  get(): Promise<V1AccountUsage> {
    return this.http.request<V1AccountUsage>('/usage');
  }
}

export class V1AccountClient {
  readonly apiKeys: V1ApiKeysClient;
  readonly notificationRecipients: V1NotificationRecipientsClient;
  readonly subaccounts: V1SubaccountsClient;
  readonly usage: V1UsageClient;

  constructor(http: V1HttpClient) {
    this.apiKeys = new V1ApiKeysClient(http);
    this.notificationRecipients = new V1NotificationRecipientsClient(http);
    this.subaccounts = new V1SubaccountsClient(http);
    this.usage = new V1UsageClient(http);
  }
}
