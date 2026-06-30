import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1BrowserExtensionFormat = OpenApiSchemas['BrowserExtension']['format'];
export type V1BrowserExtensionSource = 'upload' | 'url';

export type V1BrowserExtension = OpenApiSchemas['BrowserExtension'];

export type V1BrowserExtensionListQuery = OpenApiQuery<'browser-extensions.list'>;

export interface V1BrowserExtensionUploadRequest {
  /** Packed Chromium extension package. Only .crx is supported today. */
  file: Blob;
  /** Optional display name. Defaults to manifest.name. */
  name?: string;
}

export type V1BrowserExtensionImportRequest =
  OpenApiSchemas['BrowserExtensionImportRequest'];

export type V1BrowserExtensionUpdateRequest = OpenApiSchemas['BrowserExtensionUpdateRequest'];

export type V1BrowserExtensionDeleteResponse =
  OpenApiSchemas['BrowserExtensionDeleteResponse'];
