import { BrowsersClient } from './generated/fern/api/resources/browsers/client/Client.js';
import type { BrowserResource, BrowserCreateRequest, BrowserFetchStreamRequest, GetBrowsersRequest } from './generated/fern/api/index.js';
import { HttpResponsePromise, type BinaryResponse } from './generated/fern/core/fetcher/index.js';

export type WaitOptions = { timeoutMs?: number; signal?: AbortSignal };
export type PlaywrightConnector<T> = { chromium: { connectOverCDP: (url: string) => Promise<T> } };
export type Browser = BrowserResource & {
  connect<T>(playwright: PlaywrightConnector<T>, options?: WaitOptions): Promise<T>;
  waitUntilReady(options?: WaitOptions): Promise<Browser>;
};

/**
 * The site's response, as the browser received it: `status`, `headers` and `body` are the upstream's, not the API
 * call's. The body streams; it can be read once.
 */
export type FetchStreamResponse = BinaryResponse & {
  status: number;
  ok: boolean;
  headers: Headers;
  body: ReadableStream<Uint8Array>;
  /** The Run Event that accepted the request. */
  eventId: string | undefined;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
};

function fetchStreamResponse(data: BinaryResponse, headers: Headers): FetchStreamResponse {
  const status = Number(headers.get('BCTRL-Fetch-Status'));
  const upstream = new Headers(JSON.parse(headers.get('BCTRL-Fetch-Headers') ?? '{}') as Record<string, string>);
  const body = data.stream() ?? new ReadableStream<Uint8Array>({ start: (controller) => controller.close() });
  const text = async () => new TextDecoder().decode(await data.arrayBuffer());
  return Object.assign(data, {
    status, ok: status >= 200 && status < 300, headers: upstream, body, eventId: headers.get('BCTRL-Event-Id') ?? undefined,
    text, json: async <T>() => JSON.parse(await text()) as T,
  });
}

export class Browsers extends BrowsersClient {
  private decorate(promise: HttpResponsePromise<BrowserResource>): HttpResponsePromise<Browser> {
    return HttpResponsePromise.fromPromise(promise.withRawResponse().then(({ data, rawResponse }) => ({
      data: this.handle(data), rawResponse,
    })));
  }

  override create(request: BrowserCreateRequest = {}, options?: BrowsersClient.RequestOptions): HttpResponsePromise<Browser> {
    return this.decorate(super.create(request, options));
  }

  override get(request: GetBrowsersRequest, options?: BrowsersClient.RequestOptions): HttpResponsePromise<Browser> {
    return this.decorate(super.get(request, options));
  }

  /**
   * Sends the request from the browser and streams the response back. The request is sent once: a failure is never
   * retried, since the site may already have acted on it.
   */
  override fetchStream(request: BrowserFetchStreamRequest, options?: BrowsersClient.RequestOptions): HttpResponsePromise<FetchStreamResponse> {
    return HttpResponsePromise.fromPromise(super.fetchStream(request, { ...options, maxRetries: 0 }).withRawResponse()
      .then(({ data, rawResponse }) => ({ data: fetchStreamResponse(data, rawResponse.headers), rawResponse })));
  }

  handle(resource: BrowserResource): Browser {
    const waitUntilReady = async (options: WaitOptions = {}): Promise<Browser> => {
      const deadline = Date.now() + (options.timeoutMs ?? 120000);
      while (Date.now() < deadline) {
        const browser = await this.get({ browserId: resource.id, wait: Math.min(60, Math.max(1, Math.ceil((deadline - Date.now()) / 1000))) },
          { abortSignal: options.signal });
        if (browser.currentRun?.status === 'failed' || browser.currentRun?.status === 'ended') {
          throw new Error(`Browser Run ${browser.currentRun.status}: ${browser.currentRun.endReason ?? 'no connection available'}`);
        }
        if (browser.currentRun?.connections?.cdpUrl && browser.currentRun.status === 'active') return browser;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      throw new Error('Timed out waiting for browser connections');
    };
    return Object.defineProperties(resource, {
      waitUntilReady: { value: waitUntilReady },
      connect: { value: async <T>(playwright: PlaywrightConnector<T>, options?: WaitOptions): Promise<T> => {
        const browser = await waitUntilReady(options);
        return playwright.chromium.connectOverCDP(browser.currentRun!.connections!.cdpUrl);
      } },
    }) as Browser;
  }

  async with<T>(request: BrowserCreateRequest, work: (browser: Browser) => Promise<T>): Promise<T> {
    const browser = await this.create(request);
    let failed = false;
    let failure: unknown;
    try { return await work(browser); }
    catch (error) { failed = true; failure = error; throw error; }
    finally {
      try { await this.stop({ browserId: browser.id, wait: 60 }); }
      catch (cleanup) {
        if (failed) throw new AggregateError([failure, cleanup], 'Browser work and cleanup failed');
        throw cleanup;
      }
    }
  }
}
