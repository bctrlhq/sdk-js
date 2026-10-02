import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1Run,
  V1RunDetail,
  V1RunEvent,
  V1RunEventsListQuery,
  V1RunFile,
  V1RunFileCollectRequest,
  V1RunFilesListQuery,
  V1RunFileUploadRequest,
  V1RunListQuery,
  V1RunGetQuery,
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

  get(runId: string, query: V1RunGetQuery = {}): Promise<V1RunDetail> {
    return this.http.request(`/runs/${encodeURIComponent(runId)}`, { query });
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

/**
 * A Run's files: inputs (Space Files bound to the Run, which its browser has
 * at `runtimePath` once `binding.state` is `ready`) and outputs the Run
 * produced.
 */
export class V1RunFilesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  private path(runId: string, suffix = ''): string {
    return `/runs/${encodeURIComponent(runId)}/files${suffix}`;
  }

  list(runId: string, query: V1RunFilesListQuery = {}): Promise<V1ListEnvelope<V1RunFile>> {
    return this.http.request(this.path(runId), { query });
  }

  iter(runId: string, query: V1RunFilesListQuery = {}): AsyncGenerator<V1RunFile, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(runId, pageQuery));
  }

  get(runId: string, fileId: string): Promise<V1RunFile> {
    return this.http.request(this.path(runId, `/${encodeURIComponent(fileId)}`));
  }

  /** Bind an existing Space File to the Run. It keeps its Space path. */
  add(runId: string, fileId: string): Promise<V1RunFile> {
    return this.http.request(this.path(runId), { method: 'POST', body: { fileId } });
  }

  /**
   * Upload a Space File and bind it to the Run in one request. The route
   * requires an idempotency key; one is generated when none is given.
   */
  upload(
    runId: string,
    request: V1RunFileUploadRequest,
    options: V1IdempotencyOptions = {}
  ): Promise<V1RunFile> {
    const form = new FormData();
    if (request.filename) form.set('file', request.file, request.filename);
    else form.set('file', request.file);
    if (request.filename) form.set('filename', request.filename);
    if (request.path) form.set('path', request.path);
    return this.http.request(this.path(runId, '/upload'), {
      method: 'POST',
      body: form,
      headers: v1IdempotencyHeaders({
        idempotencyKey: options.idempotencyKey ?? globalThis.crypto.randomUUID(),
      }),
    });
  }

  /** Copy a failed input into the Run's browser again. */
  retry(runId: string, fileId: string): Promise<V1RunFile> {
    return this.http.request(this.path(runId, `/${encodeURIComponent(fileId)}/retry`), {
      method: 'POST',
    });
  }

  /** Remove an input from the Run's browser. The Space File is kept. */
  remove(runId: string, fileId: string): Promise<V1RunFile> {
    return this.http.request(this.path(runId, `/${encodeURIComponent(fileId)}`), {
      method: 'DELETE',
    });
  }

  /** Save a file from the Run's workspace (for example `downloads/report.pdf`) as an output. */
  collect(runId: string, request: V1RunFileCollectRequest): Promise<V1RunFile> {
    return this.http.request(this.path(runId, '/collect'), { method: 'POST', body: request });
  }
}
