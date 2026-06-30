import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1AiCredentialProvider = OpenApiSchemas['AiCredential']['provider'];

export type V1AiModelStatus = OpenApiSchemas['AiModel']['status'];
export type V1AiModelEngine = OpenApiSchemas['AiModel']['engines'][number];

export type V1AiModel = OpenApiSchemas['AiModel'];

export type V1AiModelListQuery = OpenApiQuery<'ai.models.list'>;

export type V1AiModelListResponse = OpenApiSchemas['AiModelListResponse'];

export type V1AiCredentialStatus = OpenApiSchemas['AiCredential']['status'];

export type V1AiCredential = OpenApiSchemas['AiCredential'];

export type V1AiCredentialListQuery = OpenApiQuery<'ai.credentials.list'>;

export type V1AiCredentialCreateRequest = OpenApiSchemas['AiCredentialCreateRequest'];

export type V1AiCredentialUpdateRequest = OpenApiSchemas['AiCredentialUpdateRequest'];

export type V1AiCredentialDeleteResponse = OpenApiSchemas['AiCredentialDeleteResponse'];

export type V1AiCredentialTestResponse = OpenApiSchemas['AiCredentialTestResponse'];

export type V1AiModelSelectionAuth = OpenApiSchemas['AiModelSelectionAuth'];

export type V1AiModelSelectionObject = OpenApiSchemas['AiModelSelection'];

export type V1AiModelSelection = string | V1AiModelSelectionObject;

export type V1AiStoredModelSelectionAuth = OpenApiSchemas['AiStoredModelSelectionAuth'];
export type V1AiStoredModelSelection = string | OpenApiSchemas['AiStoredModelSelection'];
