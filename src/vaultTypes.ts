import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1VaultSecretType = OpenApiSchemas['VaultSecret']['type'];

export type V1VaultSecret = OpenApiSchemas['VaultSecret'];

export type V1VaultSecretListQuery = OpenApiQuery<'vault.secrets.list'>;

export type V1VaultSecretUpsertRequest = OpenApiSchemas['VaultSecretUpsertRequest'];

export type V1VaultSecretPatchRequest = OpenApiSchemas['VaultSecretPatchRequest'];

export type V1VaultSecretValue = OpenApiSchemas['VaultSecretValue'];

export type V1VaultTotpResponse = OpenApiSchemas['VaultTotpResponse'];

export type V1VaultSecretDeleteResponse = OpenApiSchemas['VaultSecretDeleteResponse'];
