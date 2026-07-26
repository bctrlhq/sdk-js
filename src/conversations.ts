import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1Conversation,
  V1ConversationCancelResponse,
  V1ConversationCreateRequest,
  V1ConversationDetail,
  V1ConversationListQuery,
  V1ConversationMessageCreateRequest,
  V1ConversationStreamQuery,
  V1ConversationStreamEvent,
  V1ConversationTurn,
  V1ListEnvelope,
} from './types.js';

export class V1ConversationsClient {
  readonly messages: V1ConversationMessagesClient;
  readonly events: V1ConversationEventsClient;

  constructor(private readonly http: V1HttpClient) {
    this.messages = new V1ConversationMessagesClient(http);
    this.events = new V1ConversationEventsClient(http);
  }

  list(query: V1ConversationListQuery = {}): Promise<V1ListEnvelope<V1Conversation>> {
    return this.http.request('/conversations', { query });
  }

  iter(
    query: V1ConversationListQuery = {}
  ): AsyncGenerator<V1Conversation, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1ConversationCreateRequest): Promise<V1Conversation> {
    return this.http.request('/conversations', { method: 'POST', body: request });
  }

  get(conversationId: string): Promise<V1ConversationDetail> {
    return this.http.request(`/conversations/${encodeURIComponent(conversationId)}`);
  }

  cancel(conversationId: string): Promise<V1ConversationCancelResponse> {
    return this.http.request(`/conversations/${encodeURIComponent(conversationId)}/cancel`, {
      method: 'POST',
    });
  }
}

export class V1ConversationMessagesClient {
  constructor(private readonly http: V1HttpClient) {}

  create(
    conversationId: string,
    request: V1ConversationMessageCreateRequest,
    options?: V1IdempotencyOptions
  ): Promise<V1ConversationTurn> {
    return this.http.request(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        body: request,
        headers: v1IdempotencyHeaders(options),
      }
    );
  }
}

export class V1ConversationEventsClient {
  constructor(private readonly http: V1HttpClient) {}

  streamUrl(conversationId: string, query: V1ConversationStreamQuery = {}): string {
    const url = new URL(
      `${this.http.baseUrl}/conversations/${encodeURIComponent(conversationId)}/stream`
    );
    if (query.after !== undefined) url.searchParams.set('after', query.after);
    return url.toString();
  }

  stream(
    conversationId: string,
    query: V1ConversationStreamQuery = {},
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<V1ConversationStreamEvent, void, undefined> {
    return this.http.streamSse<V1ConversationStreamEvent>(
      `/conversations/${encodeURIComponent(conversationId)}/stream`,
      { query, signal: options.signal }
    );
  }
}
