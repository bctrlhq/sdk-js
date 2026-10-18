import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { toOutputSchema } from '../../src/index.js';

test('output schemas accept Standard JSON Schema libraries and plain JSON Schema, without the dialect marker', () => {
  const expected = { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false };
  assert.deepEqual(toOutputSchema(z.object({ title: z.string() })), expected);
  assert.deepEqual(toOutputSchema({ $schema: 'https://json-schema.org/draft/2020-12/schema', ...expected }), expected);
  assert.throws(() => toOutputSchema([] as never, 'outputSchema'), /outputSchema must be a JSON Schema object/);
});
