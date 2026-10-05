import assert from 'node:assert/strict';
import test from 'node:test';
import { Bctrl } from '../../src/index.js';

test('conversation history streams resume after a cursor and parse arbitrarily chunked SSE frames', async () => {
  const requested: string[] = [];
  const chunks = [
    'id: 42\r',
    '\nevent: task.status_changed\r\ndata: {"id":"42",',
    '"type":"task.status_changed"}\r\n\r\n: heartbeat\r\n\r\n',
    'id: 43\ndata: {"id":"43","type":"message.created"}\n\n',
  ];
  const fetchMock: typeof fetch = async (input) => {
    requested.push(String(input));
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
          controller.close();
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } }
    );
  };
  const client = new Bctrl({
    token: 'test',
    baseUrl: 'https://api.example.test',
    fetch: fetchMock,
  });

  const events = [];
  for await (const event of await client.events.stream({ conversation: 'conv_1', after: '41' })) {
    events.push(event);
  }

  assert.equal(requested[0], 'https://api.example.test/v1/events/stream?conversation=conv_1&after=41');
  assert.deepEqual(events, [
    { id: '42', type: 'task.status_changed' },
    { id: '43', type: 'message.created' },
  ]);
});
