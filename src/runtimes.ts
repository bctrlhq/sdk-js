import { v1IdempotencyHeaders, type V1HttpClient, type V1IdempotencyOptions } from './http.js';
import { V1RuntimeInvocationsNamespaceClient } from './invocations.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1ListEnvelope,
  V1File,
  V1HumanAction,
  V1HumanActionCreateRequest,
  V1HumanActionWaitRequest,
  V1HumanActionWaitResponse,
  V1Runtime,
  V1RuntimeCreateRequest,
  V1RuntimeDeleteResponse,
  V1RuntimeFileCollectRequest,
  V1RuntimeFilesListQuery,
  V1RuntimeFileStageRequest,
  V1RuntimeFileUploadRequest,
  V1RuntimeStagedFile,
  V1RuntimeListQuery,
  V1RuntimeRunListQuery,
  V1RuntimeStartResponse,
  V1RuntimeStopResponse,
  V1RuntimeTarget,
  V1RuntimeTargetCreateRequest,
  V1RuntimeUpdateRequest,
  V1RunSummary,
  V1SpaceRuntimeCreateRequest,
} from './types.js';

export type V1RuntimeStartResult = V1RuntimeStartResponse;

class V1RuntimeRunsClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runtimeId: string
  ) {}

  list(query: V1RuntimeRunListQuery = {}): Promise<V1ListEnvelope<V1RunSummary>> {
    return this.http.request<V1ListEnvelope<V1RunSummary>>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/runs`,
      { query }
    );
  }

  iter(query: V1RuntimeRunListQuery = {}): AsyncGenerator<V1RunSummary, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }
}

class V1RuntimeFilesClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runtimeId: string
  ) {}

  list(query: V1RuntimeFilesListQuery = {}): Promise<V1ListEnvelope<V1File>> {
    return this.http.request<V1ListEnvelope<V1File>>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/files`,
      { query }
    );
  }

  iter(query: V1RuntimeFilesListQuery = {}): AsyncGenerator<V1File, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  async upload(request: V1RuntimeFileUploadRequest): Promise<V1RuntimeStagedFile> {
    const form = new FormData();
    if (request.name) {
      form.set('file', request.file, request.name);
      form.set('name', request.name);
    } else {
      form.set('file', request.file);
    }
    if (request.destinationPath) form.set('destinationPath', request.destinationPath);
    if (request.runtimePath) form.set('runtimePath', request.runtimePath);
    if (request.metadata) form.set('metadata', JSON.stringify(request.metadata));

    return this.http.request<V1RuntimeStagedFile>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/files/upload`,
      {
        method: 'POST',
        body: form,
      }
    );
  }

  stage(request: V1RuntimeFileStageRequest): Promise<V1RuntimeStagedFile> {
    return this.http.request<V1RuntimeStagedFile>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/files/stage`,
      {
        method: 'POST',
        body: request,
      }
    );
  }

  collect(request: V1RuntimeFileCollectRequest): Promise<V1File> {
    return this.http.request<V1File>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/files/collect`,
      {
        method: 'POST',
        body: request,
      }
    );
  }
}

class V1RuntimeTargetsClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runtimeId: string
  ) {}

  list(): Promise<V1ListEnvelope<V1RuntimeTarget>> {
    return this.http.request<V1ListEnvelope<V1RuntimeTarget>>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/targets`
    );
  }

  create(request: V1RuntimeTargetCreateRequest = {}): Promise<V1RuntimeTarget> {
    return this.http.request<V1RuntimeTarget>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/targets`,
      {
        method: 'POST',
        body: request,
      }
    );
  }

  get(targetId: string): Promise<V1RuntimeTarget> {
    return this.http.request<V1RuntimeTarget>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/targets/${encodeURIComponent(targetId)}`
    );
  }

  activate(targetId: string): Promise<V1RuntimeTarget> {
    return this.http.request<V1RuntimeTarget>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/targets/${encodeURIComponent(
        targetId
      )}/activate`,
      { method: 'POST' }
    );
  }

  delete(targetId: string): Promise<{ id: string; deleted: boolean }> {
    return this.http.request<{ id: string; deleted: boolean }>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/targets/${encodeURIComponent(targetId)}`,
      { method: 'DELETE' }
    );
  }
}

class V1RuntimeHumanActionsClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly runtimeId: string
  ) {}

  create(request: V1HumanActionCreateRequest): Promise<V1HumanAction> {
    return this.http.request<V1HumanAction>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/human-actions`,
      {
        method: 'POST',
        body: request,
      }
    );
  }

  get(): Promise<V1HumanAction> {
    return this.http.request<V1HumanAction>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/human-actions`
    );
  }

  complete(): Promise<V1HumanAction> {
    return this.http.request<V1HumanAction>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/human-actions/complete`,
      { method: 'POST' }
    );
  }

  cancel(): Promise<V1HumanAction> {
    return this.http.request<V1HumanAction>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/human-actions/cancel`,
      { method: 'POST' }
    );
  }

  wait(request: V1HumanActionWaitRequest = {}): Promise<V1HumanActionWaitResponse> {
    return this.http.request<V1HumanActionWaitResponse>(
      `/runtimes/${encodeURIComponent(this.runtimeId)}/human-actions/wait`,
      {
        method: 'POST',
        body: request,
      }
    );
  }
}

export class V1RuntimesClient {
  readonly files: V1RuntimeFilesNamespaceClient;
  readonly runs: V1RuntimeRunsNamespaceClient;
  readonly invocations: V1RuntimeInvocationsNamespaceClient;
  readonly targets: V1RuntimeTargetsNamespaceClient;
  readonly humanAction: V1RuntimeHumanActionsNamespaceClient;
  readonly humanActions: V1RuntimeHumanActionsNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.files = new V1RuntimeFilesNamespaceClient(http);
    this.runs = new V1RuntimeRunsNamespaceClient(http);
    this.invocations = new V1RuntimeInvocationsNamespaceClient(http);
    this.targets = new V1RuntimeTargetsNamespaceClient(http);
    this.humanAction = new V1RuntimeHumanActionsNamespaceClient(http);
    this.humanActions = this.humanAction;
  }

  list(query: V1RuntimeListQuery = {}): Promise<V1ListEnvelope<V1Runtime>> {
    return this.http.request<V1ListEnvelope<V1Runtime>>('/runtimes', { query });
  }

  iter(query: V1RuntimeListQuery = {}): AsyncGenerator<V1Runtime, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  async create(request: V1RuntimeCreateRequest): Promise<V1Runtime> {
    return this.http.request<V1Runtime>('/runtimes', {
      method: 'POST',
      body: request,
    });
  }

  async createInSpace(spaceId: string, request: V1SpaceRuntimeCreateRequest): Promise<V1Runtime> {
    return this.http.request<V1Runtime>('/runtimes', {
      method: 'POST',
      body: { ...request, spaceId },
    });
  }

  update(id: string, request: V1RuntimeUpdateRequest): Promise<V1Runtime> {
    return this.http.request<V1Runtime>(`/runtimes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(id: string, options: { force?: boolean } = {}): Promise<V1RuntimeDeleteResponse> {
    return this.http.request<V1RuntimeDeleteResponse>(
      `/runtimes/${encodeURIComponent(id)}${options.force ? '?force=true' : ''}`,
      { method: 'DELETE' }
    );
  }

  get(id: string): Promise<V1Runtime> {
    return this.http.request<V1Runtime>(`/runtimes/${encodeURIComponent(id)}`);
  }

  stop(id: string): Promise<V1RuntimeStopResponse> {
    return this.http.request<V1RuntimeStopResponse>(`/runtimes/${encodeURIComponent(id)}/stop`, {
      method: 'POST',
    });
  }

  async start(id: string, options?: V1IdempotencyOptions): Promise<V1RuntimeStartResult> {
    return this.http.request<V1RuntimeStartResponse>(`/runtimes/${encodeURIComponent(id)}/start`, {
      method: 'POST',
      headers: v1IdempotencyHeaders(options),
    });
  }
}

export class V1RuntimeRunsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(
    runtimeId: string,
    query: V1RuntimeRunListQuery = {}
  ): Promise<V1ListEnvelope<V1RunSummary>> {
    return new V1RuntimeRunsClient(this.http, runtimeId).list(query);
  }

  iter(
    runtimeId: string,
    query: V1RuntimeRunListQuery = {}
  ): AsyncGenerator<V1RunSummary, void, undefined> {
    return new V1RuntimeRunsClient(this.http, runtimeId).iter(query);
  }
}

export class V1RuntimeFilesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runtimeId: string, query: V1RuntimeFilesListQuery = {}): Promise<V1ListEnvelope<V1File>> {
    return new V1RuntimeFilesClient(this.http, runtimeId).list(query);
  }

  iter(
    runtimeId: string,
    query: V1RuntimeFilesListQuery = {}
  ): AsyncGenerator<V1File, void, undefined> {
    return new V1RuntimeFilesClient(this.http, runtimeId).iter(query);
  }

  upload(runtimeId: string, request: V1RuntimeFileUploadRequest): Promise<V1RuntimeStagedFile> {
    return new V1RuntimeFilesClient(this.http, runtimeId).upload(request);
  }

  stage(runtimeId: string, request: V1RuntimeFileStageRequest): Promise<V1RuntimeStagedFile> {
    return new V1RuntimeFilesClient(this.http, runtimeId).stage(request);
  }

  collect(runtimeId: string, request: V1RuntimeFileCollectRequest): Promise<V1File> {
    return new V1RuntimeFilesClient(this.http, runtimeId).collect(request);
  }
}

export class V1RuntimeHumanActionsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  create(runtimeId: string, request: V1HumanActionCreateRequest): Promise<V1HumanAction> {
    return new V1RuntimeHumanActionsClient(this.http, runtimeId).create(request);
  }

  get(runtimeId: string): Promise<V1HumanAction> {
    return new V1RuntimeHumanActionsClient(this.http, runtimeId).get();
  }

  complete(runtimeId: string): Promise<V1HumanAction> {
    return new V1RuntimeHumanActionsClient(this.http, runtimeId).complete();
  }

  cancel(runtimeId: string): Promise<V1HumanAction> {
    return new V1RuntimeHumanActionsClient(this.http, runtimeId).cancel();
  }

  wait(
    runtimeId: string,
    request: V1HumanActionWaitRequest = {}
  ): Promise<V1HumanActionWaitResponse> {
    return new V1RuntimeHumanActionsClient(this.http, runtimeId).wait(request);
  }
}

export class V1RuntimeTargetsNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(runtimeId: string): Promise<V1ListEnvelope<V1RuntimeTarget>> {
    return new V1RuntimeTargetsClient(this.http, runtimeId).list();
  }

  create(runtimeId: string, request: V1RuntimeTargetCreateRequest = {}): Promise<V1RuntimeTarget> {
    return new V1RuntimeTargetsClient(this.http, runtimeId).create(request);
  }

  get(runtimeId: string, targetId: string): Promise<V1RuntimeTarget> {
    return new V1RuntimeTargetsClient(this.http, runtimeId).get(targetId);
  }

  activate(runtimeId: string, targetId: string): Promise<V1RuntimeTarget> {
    return new V1RuntimeTargetsClient(this.http, runtimeId).activate(targetId);
  }

  delete(runtimeId: string, targetId: string): Promise<{ id: string; deleted: boolean }> {
    return new V1RuntimeTargetsClient(this.http, runtimeId).delete(targetId);
  }
}
