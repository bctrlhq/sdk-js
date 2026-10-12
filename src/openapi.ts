// Retain the previous entrypoint's type contract. The current API is exposed
// through @bctrl/sdk/api and regenerated from the deployed specification.
import type { components, operations } from './generated/legacy-openapi-types.js';

export type OpenApiSchemas = components['schemas'];

export type OpenApiQuery<OperationId extends keyof operations> =
  operations[OperationId] extends { parameters: { query?: infer Query } }
    ? NonNullable<Query>
    : never;
