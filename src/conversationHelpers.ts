import { ConversationsClient } from './generated/fern/api/resources/conversations/client/Client.js';
import { EventsClient } from './generated/fern/api/resources/events/client/Client.js';
import type { ListEventsRequest } from './generated/fern/api/index.js';

export class Conversations extends ConversationsClient {
  /** A Conversation's history: the one Event log filtered by `conversation`, oldest first unless `order` says otherwise. */
  history(conversationId: string, query: Omit<ListEventsRequest, 'conversation'> = {}): ReturnType<EventsClient['list']> {
    return new EventsClient(this._options).list({ order: 'asc', ...query, conversation: conversationId });
  }
}
