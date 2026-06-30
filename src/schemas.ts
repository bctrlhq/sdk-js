import { z } from 'zod';

import type { JsonObject } from './types.js';

export type JsonSchemaObject = JsonObject;
export type JsonSchemaLike = JsonSchemaObject | { toJSONSchema: () => unknown } | z.ZodType;

export function toOutputSchema(schema: JsonSchemaLike, label = 'schema'): JsonSchemaObject {
  const value = resolveSchema(schema);
  if (!isJsonObject(value)) {
    throw new TypeError(`${label} must resolve to a JSON Schema object`);
  }

  const { $schema, ...jsonSchema } = value;
  void $schema;
  return jsonSchema;
}

function resolveSchema(schema: JsonSchemaLike): unknown {
  if (hasToJSONSchema(schema)) {
    return schema.toJSONSchema();
  }

  const zodJsonSchema = tryZodToJsonSchema(schema);
  if (zodJsonSchema !== undefined) return zodJsonSchema;

  return schema;
}

function hasToJSONSchema(value: unknown): value is { toJSONSchema: () => unknown } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'toJSONSchema' in value &&
    typeof value.toJSONSchema === 'function'
  );
}

function tryZodToJsonSchema(value: unknown): unknown {
  try {
    return z.toJSONSchema(value as z.ZodType);
  } catch {
    return undefined;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
