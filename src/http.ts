import { BctrlNetworkError, createV1HttpError } from './errors.js';
import {
  BCTRL_PRODUCTION_ORIGIN,
  abortableSleep,
  fetchWithTimeout,
  resolveApiKey,
  stripTrailingSlash,
} from './utils.js';
import { SDK_VERSION } from './version.js';

const API_PREFIX = '/v1';

export interface V1ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  subaccountId?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetch?: typeof fetch;
}

export interface V1RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: object;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface V1IdempotencyOptions {
  idempotencyKey?: string;
}

interface V1ErrorBody {
  error: string;
  code?: string;
  requestId?: string;
}

function resolveV1ApiBaseUrl(baseUrl?: string): string {
  const raw = stripTrailingSlash(
    baseUrl?.trim() ||
      process.env.BCTRL_BASE_URL?.trim() ||
      process.env.BCTRL_API_BASE_URL?.trim() ||
      BCTRL_PRODUCTION_ORIGIN
  );
  if (raw.endsWith(API_PREFIX)) {
    return raw;
  }
  return `${raw}${API_PREFIX}`;
}

function resolveV1ApiKey(apiKey?: string): string {
  return resolveApiKey(apiKey ?? process.env.BCTRL_API_KEY ?? '');
}

function appendQuery(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item !== undefined) params.append(key, String(item));
    }
    return;
  }
  if (typeof value === 'object') {
    return;
  }
  params.set(key, String(value));
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function responseRequestId(response: Response): string | undefined {
  return (
    response.headers.get('x-request-id') ?? response.headers.get('x-bctrl-request-id') ?? undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseV1ErrorBody(parsed: unknown, fallbackText: string): V1ErrorBody {
  if (isRecord(parsed) && typeof parsed.error === 'string') {
    return {
      error: parsed.error,
      ...(typeof parsed.code === 'string' ? { code: parsed.code } : {}),
      ...(typeof parsed.requestId === 'string' ? { requestId: parsed.requestId } : {}),
    };
  }
  if (typeof parsed === 'string' && parsed.trim()) {
    return { error: parsed.trim() };
  }
  return { error: fallbackText.trim() || 'Unknown error' };
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer
  );
}

export class V1HttpClient {
  readonly baseUrl: string;
  readonly apiKey: string;
  private readonly timeoutMs?: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly subaccountId?: string;

  constructor(options: V1ClientOptions) {
    this.baseUrl = resolveV1ApiBaseUrl(options.baseUrl);
    this.apiKey = resolveV1ApiKey(options.apiKey);
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetchImpl = options.fetch ?? fetch;
    this.subaccountId = options.subaccountId?.trim() || undefined;
  }

  withSubaccount(subaccountId: string): V1HttpClient {
    const trimmed = subaccountId.trim();
    if (!trimmed) {
      throw new TypeError('subaccountId must be a non-empty string');
    }
    return new V1HttpClient({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      subaccountId: trimmed,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      fetch: this.fetchImpl,
    });
  }

  async request<T>(path: string, options: V1RequestOptions = {}): Promise<T> {
    const response = await this.raw(path, options);
    const text = await response.text();
    return parseResponseBody(text) as T;
  }

  async raw(path: string, options: V1RequestOptions = {}): Promise<Response> {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    const query = options.query ?? {};
    for (const [key, value] of Object.entries(query)) {
      appendQuery(url.searchParams, key, value);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'x-sdk-version': SDK_VERSION,
      'User-Agent': `@bctrl/sdk/${SDK_VERSION} v1`,
      ...(this.subaccountId ? { 'BCTRL-Subaccount-Id': this.subaccountId } : {}),
      ...options.headers,
    };

    const method = options.method ?? 'GET';
    const init: RequestInit = {
      method,
      headers,
    };

    if (options.body !== undefined) {
      if (isBodyInit(options.body)) {
        init.body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(options.body);
      }
    }

    let response: Response | undefined;
    let lastNetworkError: unknown;
    const maxAttempts = canRetryRequest(method, headers) ? Math.max(1, this.maxRetries + 1) : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await fetchWithTimeout(
          url.toString(),
          { ...init, signal: options.signal },
          options.timeoutMs ?? this.timeoutMs,
          this.fetchImpl
        );
      } catch (error) {
        lastNetworkError = error;
        if (attempt < maxAttempts && isRetryableNetworkError(error)) {
          await abortableSleep(retryDelayMs(attempt), options.signal);
          continue;
        }
        if (error instanceof Error) {
          throw new BctrlNetworkError(error.message, { cause: error });
        }
        throw new BctrlNetworkError('Network request failed');
      }

      if (response.ok || !isRetryableStatus(response.status) || attempt >= maxAttempts) {
        break;
      }

      await response.body?.cancel().catch(() => undefined);
      await abortableSleep(retryAfterMs(response) ?? retryDelayMs(attempt), options.signal);
    }

    if (!response) {
      if (lastNetworkError instanceof Error) {
        throw new BctrlNetworkError(lastNetworkError.message, { cause: lastNetworkError });
      }
      throw new BctrlNetworkError('Network request failed');
    }

    if (!response.ok) {
      const text = await response.text();
      const parsed = parseResponseBody(text);
      const errorBody = parseV1ErrorBody(parsed, text);
      throw createV1HttpError({
        status: response.status,
        message: errorBody.error,
        code: errorBody.code,
        requestId: errorBody.requestId ?? responseRequestId(response),
        body: parsed,
      });
    }

    return response;
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function canRetryRequest(method: string, headers: Record<string, string>): boolean {
  const normalized = method.toUpperCase();
  if (normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS') {
    return true;
  }
  return hasHeader(headers, 'Idempotency-Key');
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const expected = name.toLowerCase();
  return Object.entries(headers).some(
    ([key, value]) => key.toLowerCase() === expected && value.trim().length > 0
  );
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.name === 'TimeoutError';
}

function retryAfterMs(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}

function retryDelayMs(attempt: number): number {
  return Math.min(2000, 250 * 2 ** Math.max(0, attempt - 1));
}

export function v1IdempotencyHeaders(
  options?: V1IdempotencyOptions
): Record<string, string> | undefined {
  const key = options?.idempotencyKey?.trim();
  return key ? { 'Idempotency-Key': key } : undefined;
}
