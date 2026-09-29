import type { V1HttpClient } from './http.js';
import type {
  V1Secret,
  V1SecretDeleteResponse,
  V1SecretList,
  V1SecretListQuery,
  V1SecretPatchRequest,
  V1SecretPutRequest,
  V1SecretRevealResponse,
} from './types.js';

export interface V1SecretWriteOptions {
  /** Write only if the Secret is still at this version; otherwise the API answers 412. */
  ifMatch?: number;
}

/**
 * A Secret path may contain `/`. Each segment is encoded on its own so the
 * slashes stay path separators (`prod/github/bot` stays three segments).
 */
function secretPath(path: string): string {
  return `/secrets/${path.split('/').map(encodeURIComponent).join('/')}`;
}

function conditional(options: V1SecretWriteOptions | undefined): Record<string, string> | undefined {
  return options?.ifMatch === undefined ? undefined : { 'If-Match': `"${options.ifMatch}"` };
}

export class V1SecretsClient {
  constructor(private readonly http: V1HttpClient) {}

  /** One page. With `delimiter: '/'`, deeper paths are grouped into `folders`. */
  list(query: V1SecretListQuery = {}): Promise<V1SecretList> {
    return this.http.request<V1SecretList>('/secrets', { query });
  }

  /** Every Secret under the query, across pages. Folders are not yielded. */
  async *iter(query: V1SecretListQuery = {}): AsyncGenerator<V1Secret, void, undefined> {
    let cursor = query.cursor;
    for (;;) {
      const page = await this.list({ ...query, cursor });
      yield* page.data;
      if (!page.nextCursor) return;
      cursor = page.nextCursor;
    }
  }

  /** Metadata only; secret fields are write-only. */
  get(path: string): Promise<V1Secret> {
    return this.http.request<V1Secret>(secretPath(path));
  }

  /** Create or replace; every write is a new version. `{ fromVersion }` alone rolls back. */
  put(path: string, request: V1SecretPutRequest, options?: V1SecretWriteOptions): Promise<V1Secret> {
    return this.http.request<V1Secret>(secretPath(path), {
      method: 'PUT',
      body: request,
      headers: conditional(options),
    });
  }

  /** Change some fields; `null` clears one. */
  update(path: string, request: V1SecretPatchRequest, options?: V1SecretWriteOptions): Promise<V1Secret> {
    return this.http.request<V1Secret>(secretPath(path), {
      method: 'PATCH',
      body: request,
      headers: conditional(options),
    });
  }

  delete(path: string, options?: V1SecretWriteOptions): Promise<V1SecretDeleteResponse> {
    return this.http.request<V1SecretDeleteResponse>(secretPath(path), {
      method: 'DELETE',
      headers: conditional(options),
    });
  }

  /** The values of the current (or a given) version. Only API keys and dashboard sessions may reveal. */
  reveal(path: string, options: { version?: number } = {}): Promise<V1SecretRevealResponse> {
    return this.http.request<V1SecretRevealResponse>('/secrets:reveal', {
      method: 'POST',
      body: { path, ...(options.version === undefined ? {} : { version: options.version }) },
    });
  }
}
