import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1AuthScope = OpenApiSchemas['AuthWhoamiResponse']['scope'];
export type V1Plan = OpenApiSchemas['AuthWhoamiResponse']['plan'];

export type V1AuthWhoamiResponse = OpenApiSchemas['AuthWhoamiResponse'];

export type V1ApiKey = OpenApiSchemas['ApiKey'];

export type V1ApiKeyListQuery = OpenApiQuery<'api-keys.list'>;

export type V1ApiKeyCreateRequest = OpenApiSchemas['ApiKeyCreateRequest'];

export type V1ApiKeyCreateResponse = OpenApiSchemas['ApiKeyCreateResponse'];

export type V1ApiKeyDeleteResponse = OpenApiSchemas['ApiKeyDeleteResponse'];

export type V1AccountUsage = OpenApiSchemas['AccountUsage'];

export type V1SubaccountLimits = OpenApiSchemas['SubaccountLimits'];

export type V1Subaccount = OpenApiSchemas['Subaccount'];

export type V1SubaccountListQuery = OpenApiQuery<'subaccounts.list'>;

export type V1SubaccountCreateRequest = OpenApiSchemas['SubaccountCreateRequest'];

export type V1SubaccountUpdateRequest = OpenApiSchemas['SubaccountUpdateRequest'];

export type V1SubaccountGetQuery = OpenApiQuery<'subaccounts.get'>;

export type V1SubaccountArchiveResponse = OpenApiSchemas['SubaccountArchiveResponse'];

export type V1SubaccountUsage = OpenApiSchemas['SubaccountUsage'];

export type V1SubaccountUsageListQuery = OpenApiQuery<'subaccounts.usage.list'>;

export type V1SubaccountUsageListResponse = OpenApiSchemas['SubaccountUsageListResponse'];
