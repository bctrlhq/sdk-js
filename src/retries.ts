import { fetcher, type Fetcher, type FetchFunction } from './generated/fern/core/fetcher/index.js';

function unknownOutcome(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== 'object' || depth > 8) return false;
  const object = value as Record<string, unknown>;
  if (object.status === 'unknown' || object.reasonClass === 'unknown' || object.reasonClass === 'outcome_unknown') return true;
  return Object.values(object).some((child) => unknownOutcome(child, depth + 1));
}

/** Each generated request enters once; Fern's own retries are disabled here. */
export function safeFetcher(delegate: FetchFunction = fetcher): FetchFunction {
  return async <R>(args: Fetcher.Args) => {
    const headers = { ...args.headers };
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(args.method.toUpperCase());
    if (mutating && !Object.keys(headers).some((name) => name.toLowerCase() === 'idempotency-key' && headers[name] != null)) {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }
    const limit = args.maxRetries ?? 2;
    const request = { ...args, headers, maxRetries: 0 };
    for (let attempt = 0; ; attempt++) {
      const result = await delegate<R>(request);
      if (result.ok || result.error.reason !== 'status-code' || unknownOutcome(result.error.body)
        || attempt >= limit || args.requestType === 'file' || args.requestType === 'bytes'
        || args.responseType === 'sse' || args.responseType === 'streaming'
        || !([408, 429].includes(result.error.statusCode) || result.error.statusCode >= 500)) return result;
      const retryAfter = Number(result.rawResponse.headers.get('Retry-After'));
      const delay = Math.min(60000, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
      await new Promise<void>((resolve, reject) => {
        const signal = args.abortSignal;
        if (signal?.aborted) { reject(signal.reason); return; }
        const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
        function abort() { clearTimeout(timer); reject(signal?.reason); }
        signal?.addEventListener('abort', abort, { once: true });
      });
    }
  };
}
