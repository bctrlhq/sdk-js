import type { components, operations } from './generated/openapi-types.js';

export type OpenApiSchemas = components['schemas'];

export type OpenApiQuery<OperationId extends keyof operations> =
  operations[OperationId] extends { parameters: { query?: infer Query } }
    ? NonNullable<Query>
    : never;

