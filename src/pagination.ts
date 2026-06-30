import type { V1ListEnvelope, V1PageQuery } from './types.js';

export async function* iterateV1Pages<T, Q extends V1PageQuery>(
  initialQuery: Q,
  fetchPage: (query: Q) => Promise<V1ListEnvelope<T>>
): AsyncGenerator<T, void, undefined> {
  let cursor = initialQuery.cursor;

  for (;;) {
    const page = await fetchPage({ ...initialQuery, cursor } as Q);
    for (const item of page.data) {
      yield item;
    }
    if (!page.nextCursor) {
      return;
    }
    cursor = page.nextCursor;
  }
}
