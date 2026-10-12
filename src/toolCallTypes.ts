import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1ToolCallCallerType = OpenApiSchemas['ToolCall']['callerType'];
export type V1ToolCallStatus = OpenApiSchemas['ToolCall']['status'];
export type V1ToolName = OpenApiSchemas['ToolCall']['tool'];

export type V1ToolCall = OpenApiSchemas['ToolCall'];

export type V1ToolCallListQuery = OpenApiQuery<'tool-calls.list'>;
