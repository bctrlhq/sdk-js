import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1File,
  V1InvocationResponse,
  V1InvocationSummary,
  V1Run,
  V1RunEvent,
  V1RunEventsListQuery,
  V1RunListQuery,
  V1RunLiveRequest,
  V1RunLiveResponse,
  V1RunRecordingRequest,
  V1RunRecordingResponse,
  V1RunActivityItem,
  V1RunActivityListQuery,
  V1RunFilesExportRequest,
  V1RunFilesListQuery,
  V1RunInvocationsListQuery,
  V1RunUsage,
} from './types.js';

class V1RunEventsClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runId: string
  ) {}

  list(query: V1RunEventsListQuery = {}): Promise<V1ListEnvelope<V1RunEvent>> {
    return this.http.request<V1ListEnvelope<V1RunEvent>>(
      `/runs/${encodeURIComponent(this.runId)}/events`,
      { query }
    );
  }

  iter(query: V1RunEventsListQuery = {}): AsyncGenerator<V1RunEvent, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  streamUrl(
    query: Pick<V1RunEventsListQuery, 'type' | 'status' | 'pageId' | 'contextId'> = {}
  ): string {
    const url = new URL(
      `${this.http.baseUrl}/runs/${encodeURIComponent(this.runId)}/events/stream`
    );
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, item);
      } else {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }
}

class V1RunActivityClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runId: string
  ) {}

  list(query: V1RunActivityListQuery = {}): Promise<V1ListEnvelope<V1RunActivityItem>> {
    return this.http.request<V1ListEnvelope<V1RunActivityItem>>(
      `/runs/${encodeURIComponent(this.runId)}/activity`,
      { query }
    );
  }

  iter(query: V1RunActivityListQuery = {}): AsyncGenerator<V1RunActivityItem, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  streamUrl(query: V1RunActivityListQuery = {}): string {
    const url = new URL(
      `${this.http.baseUrl}/runs/${encodeURIComponent(this.runId)}/activity/stream`
    );
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

export class V1RunsClient {
  readonly events: V1RunEventsNamespaceClient;
  readonly activity: V1RunActivityNamespaceClient;
  readonly files: V1RunFilesNamespaceClient;
  readonly invocations: V1RunInvocationsNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.events = new V1RunEventsNamespaceClient(http);
    this.activity = new V1RunActivityNamespaceClient(http);
    this.files = new V1RunFilesNamespaceClient(http);
    this.invocations = new V1RunInvocationsNamespaceClient(http);
  }

  list(query: V1RunListQuery = {}): Promise<V1ListEnvelope<V1Run>> {
    return this.http.request<V1ListEnvelope<V1Run>>('/runs', { query });
  }

  iter(query: V1RunListQuery = {}): AsyncGenerator<V1Run, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(id: string): Promise<V1Run> {
    return this.http.request<V1Run>(`/runs/${encodeURIComponent(id)}`);
  }

  usage(id: string): Promise<V1RunUsage> {
    return this.http.request<V1RunUsage>(`/runs/${encodeURIComponent(id)}/usage`);
  }

  live(id: string, request?: V1RunLiveRequest): Promise<V1RunLiveResponse> {
    return this.http.request<V1RunLiveResponse>(`/runs/${encodeURIComponent(id)}/live`, {
      method: 'POST',
      body: request ?? {},
    });
  }

  recording(id: string, request?: V1RunRecordingRequest): Promise<V1RunRecordingResponse> {
    return this.http.request<V1RunRecordingResponse>(
      `/runs/${encodeURIComponent(id)}/recording`,
      {
        method: 'POST',
        body: request ?? {},
      }
    );
  }
}

export class V1RunEventsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string, query: V1RunEventsListQuery = {}): Promise<V1ListEnvelope<V1RunEvent>> {
    return new V1RunEventsClient(this.http, runId).list(query);
  }

  iter(
    runId: string,
    query: V1RunEventsListQuery = {}
  ): AsyncGenerator<V1RunEvent, void, undefined> {
    return new V1RunEventsClient(this.http, runId).iter(query);
  }

  streamUrl(
    runId: string,
    query: Pick<V1RunEventsListQuery, 'type' | 'status' | 'pageId' | 'contextId'> = {}
  ): string {
    return new V1RunEventsClient(this.http, runId).streamUrl(query);
  }
}

export class V1RunActivityNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(
    runId: string,
    query: V1RunActivityListQuery = {}
  ): Promise<V1ListEnvelope<V1RunActivityItem>> {
    return new V1RunActivityClient(this.http, runId).list(query);
  }

  iter(
    runId: string,
    query: V1RunActivityListQuery = {}
  ): AsyncGenerator<V1RunActivityItem, void, undefined> {
    return new V1RunActivityClient(this.http, runId).iter(query);
  }

  streamUrl(runId: string, query: V1RunActivityListQuery = {}): string {
    return new V1RunActivityClient(this.http, runId).streamUrl(query);
  }
}

export class V1RunFilesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string, query: V1RunFilesListQuery = {}) {
    return this.http.request<V1ListEnvelope<V1File>>(
      `/runs/${encodeURIComponent(runId)}/files`,
      { query }
    );
  }

  iter(runId: string, query: V1RunFilesListQuery = {}) {
    return iterateV1Pages(query, (pageQuery) => this.list(runId, pageQuery));
  }

  export(
    runId: string,
    request: V1RunFilesExportRequest = {},
    options?: V1IdempotencyOptions
  ): Promise<V1File> {
    return this.http.request<V1File>(`/runs/${encodeURIComponent(runId)}/files/export`, {
      method: 'POST',
      body: request,
      headers: v1IdempotencyHeaders(options),
    });
  }
}

export class V1RunInvocationsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string, query: V1RunInvocationsListQuery = {}) {
    return this.http.request<V1ListEnvelope<V1InvocationSummary>>(
      `/runs/${encodeURIComponent(runId)}/invocations`,
      { query }
    );
  }

  iter(runId: string, query: V1RunInvocationsListQuery = {}) {
    return iterateV1Pages(query, (pageQuery) => this.list(runId, pageQuery));
  }

  get(runId: string, invocationId: string) {
    return this.http.request<V1InvocationResponse>(
      `/runs/${encodeURIComponent(runId)}/invocations/${encodeURIComponent(invocationId)}`
    );
  }
}
