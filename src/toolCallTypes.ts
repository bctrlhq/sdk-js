import type { OpenApiQuery, OpenApiSchemas } from './openapi.js';

export type V1ToolCallActor = OpenApiSchemas['ToolCall']['actor'];
export type V1ToolCallStatus = OpenApiSchemas['ToolCall']['status'];

export type V1ToolCallTool = OpenApiSchemas['ToolCallTool'];

export type V1ToolCall = OpenApiSchemas['ToolCall'];

export type V1ToolCallListQuery = OpenApiQuery<'tool-calls.list'>;
