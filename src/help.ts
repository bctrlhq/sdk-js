import type { V1HttpClient } from './http.js';
import type { V1HelpRequest, V1HelpResponse } from './types.js';

export class V1HelpClient {
  constructor(private readonly http: V1HttpClient) {}

  get(request: V1HelpRequest = {}): Promise<V1HelpResponse> {
    return this.http.request<V1HelpResponse>('/help', { query: request });
  }
}
