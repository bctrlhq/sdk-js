import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1ToolsetBuiltinName = OpenApiSchemas['Toolset']['builtins'][number];

export type V1Toolset = OpenApiSchemas['Toolset'];

export type V1ToolsetListQuery = OpenApiQuery<'toolsets.list'>;

export type V1ToolsetCreateRequest = OpenApiSchemas['ToolsetCreateRequest'];

export type V1ToolsetUpdateRequest = OpenApiSchemas['ToolsetUpdateRequest'];

export type V1ToolsetDeleteResponse = OpenApiSchemas['ToolsetDeleteResponse'];
