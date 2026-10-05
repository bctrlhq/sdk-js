import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

const BROWSER = {
  object: 'browser', id: 'br_1', name: null, spaceId: 'sp_1', status: 'idle', currentRun: null,
};

test('a browser reads its Events and a Conversation its history from the one log', async () => {
  const urls: URL[] = [];
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (input) => {
    const url = new URL(String(input));
    urls.push(url);
    if (url.pathname === '/v1/browsers/br_1') return Response.json(BROWSER);
    return Response.json({ data: [], hasMore: false, nextCursor: null });
  } });
  const browser = client.browsers.handle({ ...BROWSER } as never);
  await browser.events.list({ category: 'control', limit: 10 });
  await client.conversations.history('conv_1', { type: 'message.created' });
  assert.equal(urls[0]!.pathname, '/v1/events');
  assert.equal(urls[0]!.searchParams.get('browser'), 'br_1');
  assert.equal(urls[0]!.searchParams.get('category'), 'control');
  assert.equal(urls[1]!.pathname, '/v1/events');
  assert.equal(urls[1]!.searchParams.get('conversation'), 'conv_1');
  assert.equal(urls[1]!.searchParams.get('order'), 'asc');
  assert.equal(urls[1]!.searchParams.get('type'), 'message.created');
});

test('a browser streams its Events with resume', async () => {
  let requested: URL | undefined;
  const client = new Bctrl({ token: 'test', baseUrl: 'https://api.example.test', fetch: async (input) => {
    requested = new URL(String(input));
    const event = { object: 'event', id: 'evt_1', type: 'runtime.lifecycle' };
    return new Response(`id: evt_1\nevent: runtime.lifecycle\ndata: ${JSON.stringify(event)}\n\n`,
      { headers: { 'content-type': 'text/event-stream' } });
  } });
  const stream = await client.browsers.handle({ ...BROWSER } as never).events.stream({ after: 'evt_0' });
  const received: unknown[] = [];
  for await (const event of stream) received.push(event);
  assert.equal(requested!.pathname, '/v1/events/stream');
  assert.equal(requested!.searchParams.get('browser'), 'br_1');
  assert.equal(requested!.searchParams.get('after'), 'evt_0');
  assert.deepEqual(received.map((event) => (event as { id: string }).id), ['evt_1']);
});
