import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Run,
  V1RunEvent,
  V1RunEventsListQuery,
  V1RunFile,
  V1RunListQuery,
  V1RunStreamEvent,
  V1RunStreamQuery,
  V1TraceSpan,
  V1RunTraceListQuery,
} from './types.js';

function streamUrl(http: V1HttpClient, runId: string, query: V1RunStreamQuery): string {
  const url = new URL(`${http.baseUrl}/runs/${encodeURIComponent(runId)}/stream`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export class V1RunsClient {
  readonly events: V1RunEventsNamespaceClient;
  readonly trace: V1RunTraceNamespaceClient;
  readonly files: V1RunFilesNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.events = new V1RunEventsNamespaceClient(http);
    this.trace = new V1RunTraceNamespaceClient(http);
    this.files = new V1RunFilesNamespaceClient(http);
  }

  list(query: V1RunListQuery = {}): Promise<V1ListEnvelope<V1Run>> {
    return this.http.request('/runs', { query });
  }

  iter(query: V1RunListQuery = {}): AsyncGenerator<V1Run, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(runId: string): Promise<V1Run> {
    return this.http.request(`/runs/${encodeURIComponent(runId)}`);
  }

  streamUrl(runId: string, query: V1RunStreamQuery = {}): string {
    return streamUrl(this.http, runId, query);
  }

  stream(
    runId: string,
    query: V1RunStreamQuery = {},
    options: { signal?: AbortSignal } = {}
  ): AsyncGenerator<V1RunStreamEvent, void, undefined> {
    return this.http.streamSse<V1RunStreamEvent>(
      `/runs/${encodeURIComponent(runId)}/stream`,
      { query, signal: options.signal }
    );
  }
}

export class V1RunEventsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string, query: V1RunEventsListQuery = {}): Promise<V1ListEnvelope<V1RunEvent>> {
    return this.http.request(`/runs/${encodeURIComponent(runId)}/events`, { query });
  }

  iter(
    runId: string,
    query: V1RunEventsListQuery = {}
  ): AsyncGenerator<V1RunEvent, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(runId, pageQuery));
  }
}

export class V1RunTraceNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string, query: V1RunTraceListQuery = {}): Promise<V1ListEnvelope<V1TraceSpan>> {
    return this.http.request(`/runs/${encodeURIComponent(runId)}/trace`, { query });
  }

  iter(
    runId: string,
    query: V1RunTraceListQuery = {}
  ): AsyncGenerator<V1TraceSpan, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(runId, pageQuery));
  }
}

export class V1RunFilesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runId: string): Promise<{ data: V1RunFile[] }> {
    return this.http.request(`/runs/${encodeURIComponent(runId)}/files`);
  }
}
