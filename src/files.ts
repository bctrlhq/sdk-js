import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1File,
  V1FileDeleteResponse,
  V1FilesListQuery,
  V1FilesListResponse,
  V1FileUpdateRequest,
  V1FileUploadRequest,
  V1ListEnvelope,
} from './types.js';

export class V1FilesClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1FilesListQuery = {}): Promise<V1FilesListResponse> {
    return this.http.request<V1FilesListResponse>('/files', { query });
  }

  iter(query: V1FilesListQuery = {}): AsyncGenerator<V1File, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(id: string): Promise<V1File> {
    return this.http.request<V1File>(`/files/${encodeURIComponent(id)}`);
  }

  update(id: string, request: V1FileUpdateRequest): Promise<V1File> {
    return this.http.request<V1File>(`/files/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: request,
    });
  }

  content(id: string): Promise<Response> {
    return this.http.raw(`/files/${encodeURIComponent(id)}/content`);
  }

  delete(id: string): Promise<V1FileDeleteResponse> {
    return this.http.request<V1FileDeleteResponse>(`/files/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  upload(request: V1FileUploadRequest): Promise<V1File> {
    const form = new FormData();
    if (request.name) {
      form.set('file', request.file, request.name);
    } else {
      form.set('file', request.file);
    }
    if (request.name) form.set('name', request.name);
    if (request.path) form.set('path', request.path);
    if (request.metadata) form.set('metadata', JSON.stringify(request.metadata));

    return this.http.request<V1File>('/files', {
      method: 'POST',
      query: request.spaceId ? { spaceId: request.spaceId } : undefined,
      body: form,
    });
  }
}
