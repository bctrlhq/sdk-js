export type JsonSchemaObject = { [key: string]: unknown };

/**
 * A schema that converts itself to JSON Schema through the Standard JSON Schema interface
 * (https://standardschema.dev): Zod 4.2+, ArkType, Valibot and others.
 */
export type StandardJsonSchema = {
  readonly '~standard': {
    readonly jsonSchema: { readonly output: (options: { readonly target: 'draft-2020-12' }) => Record<string, unknown> };
  };
};

export type JsonSchemaLike = JsonSchemaObject | StandardJsonSchema;

/** The JSON Schema object the API takes, without its `$schema` dialect marker. */
export function toOutputSchema(schema: JsonSchemaLike, label = 'schema'): JsonSchemaObject {
  const value = isStandardJsonSchema(schema) ? schema['~standard'].jsonSchema.output({ target: 'draft-2020-12' }) : schema;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a JSON Schema object or a Standard JSON Schema`);
  }
  const { $schema: _dialect, ...jsonSchema } = value;
  return jsonSchema;
}

function isStandardJsonSchema(value: unknown): value is StandardJsonSchema {
  const standard = (value as { '~standard'?: { jsonSchema?: { output?: unknown } } } | null)?.['~standard'];
  return typeof standard?.jsonSchema?.output === 'function';
}
