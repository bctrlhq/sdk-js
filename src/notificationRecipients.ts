import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1NotificationRecipient,
  V1NotificationRecipientCreateRequest,
  V1NotificationRecipientDeleteResponse,
  V1NotificationRecipientListQuery,
  V1NotificationRecipientUpdateRequest,
} from './types.js';

export class V1NotificationRecipientsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(
    query: V1NotificationRecipientListQuery = {}
  ): Promise<V1ListEnvelope<V1NotificationRecipient>> {
    return this.http.request<V1ListEnvelope<V1NotificationRecipient>>('/notification-recipients', {
      query,
    });
  }

  iter(
    query: V1NotificationRecipientListQuery = {}
  ): AsyncGenerator<V1NotificationRecipient, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1NotificationRecipientCreateRequest): Promise<V1NotificationRecipient> {
    return this.http.request<V1NotificationRecipient>('/notification-recipients', {
      method: 'POST',
      body: request,
    });
  }

  update(
    recipientId: string,
    request: V1NotificationRecipientUpdateRequest
  ): Promise<V1NotificationRecipient> {
    return this.http.request<V1NotificationRecipient>(
      `/notification-recipients/${encodeURIComponent(recipientId)}`,
      {
        method: 'PATCH',
        body: request,
      }
    );
  }

  delete(recipientId: string): Promise<V1NotificationRecipientDeleteResponse> {
    return this.http.request<V1NotificationRecipientDeleteResponse>(
      `/notification-recipients/${encodeURIComponent(recipientId)}`,
      {
        method: 'DELETE',
      }
    );
  }
}
