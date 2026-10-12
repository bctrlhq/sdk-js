import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Webhook,
  V1WebhookCreateRequest,
  V1WebhookCreateResponse,
  V1WebhookDeleteResponse,
  V1WebhookDeliveriesListQuery,
  V1WebhookDelivery,
  V1WebhookRotateSecretResponse,
  V1WebhooksListQuery,
  V1WebhookUpdateRequest,
} from './types.js';

export class V1WebhookDeliveriesClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly webhookId: string
  ) {}

  list(
    query: V1WebhookDeliveriesListQuery = {}
  ): Promise<V1ListEnvelope<V1WebhookDelivery>> {
    return this.http.request<V1ListEnvelope<V1WebhookDelivery>>(
      `/webhooks/${encodeURIComponent(this.webhookId)}/deliveries`,
      { query }
    );
  }

  iter(
    query: V1WebhookDeliveriesListQuery = {}
  ): AsyncGenerator<V1WebhookDelivery, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  redeliver(deliveryId: string): Promise<V1WebhookDelivery> {
    return this.http.request<V1WebhookDelivery>(
      `/webhooks/${encodeURIComponent(this.webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/redeliver`,
      { method: 'POST' }
    );
  }
}

export class V1WebhookDeliveriesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(
    webhookId: string,
    query: V1WebhookDeliveriesListQuery = {}
  ): Promise<V1ListEnvelope<V1WebhookDelivery>> {
    return new V1WebhookDeliveriesClient(this.http, webhookId).list(query);
  }

  iter(
    webhookId: string,
    query: V1WebhookDeliveriesListQuery = {}
  ): AsyncGenerator<V1WebhookDelivery, void, undefined> {
    return new V1WebhookDeliveriesClient(this.http, webhookId).iter(query);
  }

  redeliver(webhookId: string, deliveryId: string): Promise<V1WebhookDelivery> {
    return new V1WebhookDeliveriesClient(this.http, webhookId).redeliver(deliveryId);
  }
}

export class V1WebhooksClient {
  readonly deliveries: V1WebhookDeliveriesNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.deliveries = new V1WebhookDeliveriesNamespaceClient(http);
  }

  list(query: V1WebhooksListQuery = {}): Promise<V1ListEnvelope<V1Webhook>> {
    return this.http.request<V1ListEnvelope<V1Webhook>>('/webhooks', { query });
  }

  iter(query: V1WebhooksListQuery = {}): AsyncGenerator<V1Webhook, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1WebhookCreateRequest): Promise<V1WebhookCreateResponse> {
    return this.http.request<V1WebhookCreateResponse>('/webhooks', {
      method: 'POST',
      body: request,
    });
  }

  get(webhookId: string): Promise<V1Webhook> {
    return this.http.request<V1Webhook>(`/webhooks/${encodeURIComponent(webhookId)}`);
  }

  update(webhookId: string, request: V1WebhookUpdateRequest): Promise<V1Webhook> {
    return this.http.request<V1Webhook>(`/webhooks/${encodeURIComponent(webhookId)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(webhookId: string): Promise<V1WebhookDeleteResponse> {
    return this.http.request<V1WebhookDeleteResponse>(
      `/webhooks/${encodeURIComponent(webhookId)}`,
      { method: 'DELETE' }
    );
  }

  rotateSecret(webhookId: string): Promise<V1WebhookRotateSecretResponse> {
    return this.http.request<V1WebhookRotateSecretResponse>(
      `/webhooks/${encodeURIComponent(webhookId)}/rotate-secret`,
      { method: 'POST' }
    );
  }

  test(webhookId: string): Promise<V1WebhookDelivery> {
    return this.http.request<V1WebhookDelivery>(
      `/webhooks/${encodeURIComponent(webhookId)}/test`,
      { method: 'POST' }
    );
  }
}
