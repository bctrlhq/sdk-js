import type { V1HttpClient } from './http.js';
import { iterateV1Pages } from './pagination.js';
import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1Location = OpenApiSchemas['Location'];
export type V1LocationsListQuery = OpenApiQuery<'locations.list'>;
export type V1LocationsListResponse = OpenApiSchemas['LocationsListResponse'];

export class V1LocationsClient {
  constructor(private readonly http: V1HttpClient) {}

  list(query: V1LocationsListQuery = {}): Promise<V1LocationsListResponse> {
    return this.http.request('/locations', { query });
  }

  iter(query: V1LocationsListQuery = {}): AsyncGenerator<V1Location, void, undefined> {
    return iterateV1Pages(query, (pageQuery) => this.list(pageQuery));
  }
}
