export const BCTRL_PRODUCTION_ORIGIN = 'https://api.bctrl.ai';

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('BCTRL_API_KEY is required. Pass apiKey or set BCTRL_API_KEY.');
  }
  return trimmed;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs?: number,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  if (!timeoutMs) {
    return fetchImpl(input, init);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const timeout = setTimeout(cleanup, ms);
    const onAbort = (): void => {
      clearTimeout(timeout);
      reject(createAbortError());
    };
    function cleanup(): void {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}
