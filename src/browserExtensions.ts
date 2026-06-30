import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type {
  V1BrowserExtension,
  V1BrowserExtensionDeleteResponse,
  V1BrowserExtensionImportRequest,
  V1BrowserExtensionListQuery,
  V1BrowserExtensionUpdateRequest,
  V1BrowserExtensionUploadRequest,
} from './browserExtensionTypes.js';
import type { V1ListEnvelope } from './types.js';

function browserExtensionFileName(file: Blob): string {
  const name = (file as Blob & { name?: unknown }).name;
  return typeof name === 'string' && name.trim() ? name : 'extension.crx';
}

export class V1BrowserExtensionsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1BrowserExtensionListQuery = {}): Promise<V1ListEnvelope<V1BrowserExtension>> {
    return this.http.request<V1ListEnvelope<V1BrowserExtension>>('/browser-extensions', {
      query,
    });
  }

  iter(
    query: V1BrowserExtensionListQuery = {}
  ): AsyncGenerator<V1BrowserExtension, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }

  get(extensionId: string): Promise<V1BrowserExtension> {
    return this.http.request<V1BrowserExtension>(
      `/browser-extensions/${encodeURIComponent(extensionId)}`
    );
  }

  upload(request: V1BrowserExtensionUploadRequest): Promise<V1BrowserExtension> {
    const form = new FormData();
    form.set('file', request.file, browserExtensionFileName(request.file));
    if (request.name) {
      form.set('name', request.name);
    }
    if (request.subaccountId) {
      form.set('subaccountId', request.subaccountId);
    }

    return this.http.request<V1BrowserExtension>('/browser-extensions/upload', {
      method: 'POST',
      body: form,
    });
  }

  import(request: V1BrowserExtensionImportRequest): Promise<V1BrowserExtension> {
    return this.http.request<V1BrowserExtension>('/browser-extensions/import', {
      method: 'POST',
      body: request,
    });
  }

  update(
    extensionId: string,
    request: V1BrowserExtensionUpdateRequest
  ): Promise<V1BrowserExtension> {
    return this.http.request<V1BrowserExtension>(
      `/browser-extensions/${encodeURIComponent(extensionId)}`,
      {
        method: 'PATCH',
        body: request,
      }
    );
  }

  delete(extensionId: string): Promise<V1BrowserExtensionDeleteResponse> {
    return this.http.request<V1BrowserExtensionDeleteResponse>(
      `/browser-extensions/${encodeURIComponent(extensionId)}`,
      {
        method: 'DELETE',
      }
    );
  }
}
