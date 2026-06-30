import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import { V1RuntimesClient } from './runtimes.js';
import type {
  V1ListEnvelope,
  V1Runtime,
  V1RuntimeListQuery,
  V1Space,
  V1SpaceCreateRequest,
  V1SpaceDeleteResponse,
  V1SpaceEnvironment,
  V1SpaceEnvironmentUpdateRequest,
  V1SpaceListQuery,
  V1SpaceRuntimeCreateRequest,
  V1SpaceUpdateRequest,
} from './types.js';

class V1SpaceEnvironmentClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly spaceId: string
  ) {}

  get(): Promise<V1SpaceEnvironment> {
    return this.http.request<V1SpaceEnvironment>(
      `/spaces/${encodeURIComponent(this.spaceId)}/environment`
    );
  }

  update(request: V1SpaceEnvironmentUpdateRequest): Promise<V1SpaceEnvironment> {
    return this.http.request<V1SpaceEnvironment>(
      `/spaces/${encodeURIComponent(this.spaceId)}/environment`,
      {
        method: 'PATCH',
        body: request,
      }
    );
  }
}

class V1SpaceRuntimesClient {
  constructor(
    private readonly http: V1HttpClient,
    private readonly spaceId: string
  ) {}

  list(query: Omit<V1RuntimeListQuery, 'spaceId'> = {}): ReturnType<V1RuntimesClient['list']> {
    return new V1RuntimesClient(this.http).list({ ...query, spaceId: this.spaceId });
  }

  iter(query: Omit<V1RuntimeListQuery, 'spaceId'> = {}): ReturnType<V1RuntimesClient['iter']> {
    return new V1RuntimesClient(this.http).iter({ ...query, spaceId: this.spaceId });
  }

  create(request: V1SpaceRuntimeCreateRequest): Promise<V1Runtime> {
    return new V1RuntimesClient(this.http).createInSpace(this.spaceId, request);
  }

  get(runtimeId: string): Promise<V1Runtime> {
    return new V1RuntimesClient(this.http).get(runtimeId);
  }

  stop(runtimeId: string): ReturnType<V1RuntimesClient['stop']> {
    return new V1RuntimesClient(this.http).stop(runtimeId);
  }

  start(runtimeId: string): ReturnType<V1RuntimesClient['start']> {
    return new V1RuntimesClient(this.http).start(runtimeId);
  }
}

export class V1SpacesClient {
  readonly environment: V1SpaceEnvironmentNamespaceClient;
  readonly runtimes: V1SpaceRuntimesNamespaceClient;

  constructor(private readonly http: V1HttpClient) {
    this.environment = new V1SpaceEnvironmentNamespaceClient(http);
    this.runtimes = new V1SpaceRuntimesNamespaceClient(http);
  }

  list(query: V1SpaceListQuery = {}): Promise<V1ListEnvelope<V1Space>> {
    return this.http.request<V1ListEnvelope<V1Space>>('/spaces', { query });
  }

  iter(query: V1SpaceListQuery = {}): AsyncGenerator<V1Space, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  create(request: V1SpaceCreateRequest): Promise<V1Space> {
    return this.http.request<V1Space>('/spaces', {
      method: 'POST',
      body: request,
    });
  }

  get(id: string): Promise<V1Space> {
    return this.http.request<V1Space>(`/spaces/${encodeURIComponent(id)}`);
  }

  update(id: string, request: V1SpaceUpdateRequest): Promise<V1Space> {
    return this.http.request<V1Space>(`/spaces/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  delete(id: string): Promise<V1SpaceDeleteResponse> {
    return this.http.request<V1SpaceDeleteResponse>(`/spaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}

export class V1SpaceEnvironmentNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  get(spaceId: string): Promise<V1SpaceEnvironment> {
    return new V1SpaceEnvironmentClient(this.http, spaceId).get();
  }

  update(spaceId: string, request: V1SpaceEnvironmentUpdateRequest): Promise<V1SpaceEnvironment> {
    return new V1SpaceEnvironmentClient(this.http, spaceId).update(request);
  }
}

export class V1SpaceRuntimesNamespaceClient {
  constructor(private readonly http: V1HttpClient) {}

  list(
    spaceId: string,
    query: Omit<V1RuntimeListQuery, 'spaceId'> = {}
  ): ReturnType<V1RuntimesClient['list']> {
    return new V1RuntimesClient(this.http).list({ ...query, spaceId });
  }

  iter(
    spaceId: string,
    query: Omit<V1RuntimeListQuery, 'spaceId'> = {}
  ): ReturnType<V1RuntimesClient['iter']> {
    return new V1RuntimesClient(this.http).iter({ ...query, spaceId });
  }

  create(spaceId: string, request: V1SpaceRuntimeCreateRequest): Promise<V1Runtime> {
    return new V1RuntimesClient(this.http).createInSpace(spaceId, request);
  }
}
