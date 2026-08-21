import assert from 'node:assert/strict';
import test from 'node:test';

import { Bctrl } from '../../../src/index.js';

const shouldRun = process.env.BCTRL_E2E === '1' && Boolean(process.env.BCTRL_API_KEY);
const AI_MODEL = 'openai/gpt-5.6-luna';
const POLL_INTERVAL_MS = 1_000;

type ConversationDetail = Awaited<ReturnType<Bctrl['conversations']['get']>>;

async function waitForAssistantMessage(
  client: Bctrl,
  conversationId: string,
  turnId: string,
  timeoutMs: number
): Promise<{ detail: ConversationDetail; text: string; model: string | null }> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const detail = await client.conversations.get(conversationId);
    const assistant = detail.messages.find(
      (message) => message.role === 'assistant' && message.turnId === turnId
    );

    if (detail.status === 'idle' && assistant?.text) {
      return { detail, text: assistant.text, model: assistant.model };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Conversation ${conversationId} did not produce an assistant message in time`);
}

test(
  'SDK drives a gateway runtime, browser tool, and Luna agent conversation end to end',
  { skip: shouldRun ? false : 'set BCTRL_E2E=1 and BCTRL_API_KEY', timeout: 420_000 },
  async () => {
    const client = new Bctrl({
      apiKey: process.env.BCTRL_API_KEY,
      baseUrl: process.env.BCTRL_API_BASE_URL,
    });

    let spaceId: string | undefined;
    let runtimeId: string | undefined;
    let runId: string | undefined;
    let conversationId: string | undefined;
    let fileId: string | undefined;

    try {
      const space = await client.spaces.create({
        name: `sdk-agent-e2e-${Date.now()}`,
        environment: {
          ai: {
            default: {
              model: AI_MODEL,
              reasoningEffort: 'high',
            },
          },
        },
      });
      const currentSpaceId = space.id;
      spaceId = currentSpaceId;

      const file = await client.files.upload({
        spaceId: currentSpaceId,
        file: new Blob(['SDK gateway workflow fixture\n'], { type: 'text/plain' }),
        name: 'sdk-workflow-fixture.txt',
        path: 'e2e/sdk-workflow-fixture.txt',
        metadata: { suite: 'sdk-gateway-e2e' },
      });
      fileId = file.id;

      const files = await client.files.list({ spaceId: currentSpaceId, limit: 100 });
      assert(files.data.some((entry) => entry.id === file.id));

      const content = await client.files.content(file.id);
      assert.equal(await content.text(), 'SDK gateway workflow fixture\n');

      const renamedFile = await client.files.update(file.id, {
        name: 'sdk-workflow-fixture-renamed.txt',
      });
      assert.equal(renamedFile.name, 'sdk-workflow-fixture-renamed.txt');

      const runtime = await client.runtimes.create({
        spaceId: currentSpaceId,
        type: 'browser',
        name: `sdk-agent-runtime-${Date.now()}`,
        profile: false,
        start: false,
        config: { headless: true },
      });
      runtimeId = runtime.id;

      const started = await client.runtimes.start(runtime.id);
      runId = started.runId;
      const activeRunId = started.runId;
      assert.equal(started.runtimeId, runtime.id);
      assert.equal(started.status, 'active');

      const opened = await client.tools.call(
        'browser.pages.open',
        { url: 'https://example.com' },
        { runtimeId: runtime.id }
      );
      assert.equal(typeof opened, 'object');

      const conversation = await client.conversations.create({
        runtimeId: runtime.id,
        model: AI_MODEL,
        title: 'SDK gateway agent workflow',
      });
      conversationId = conversation.id;
      assert.equal(conversation.model, AI_MODEL);

      const accepted = await client.conversations.messages.create(conversation.id, {
        text:
          'Use the currently open page and report its exact document title. Reply with only the title.',
        model: AI_MODEL,
        fileIds: [file.id],
      });
      assert.equal(accepted.status, 'queued');
      assert.equal(accepted.runId, activeRunId);

      const completed = await waitForAssistantMessage(
        client,
        conversation.id,
        accepted.turnId,
        360_000
      );
      assert.equal(completed.model, AI_MODEL);
      assert.match(completed.text, /example domain/i);
      assert(
        completed.detail.messages.some(
          (message) => message.id === accepted.messageId && message.role === 'user'
        )
      );

      const run = await client.runs.get(activeRunId, { include: 'connection' });
      assert.equal(run.id, activeRunId);
      assert.equal(run.runtimeId, runtime.id);

      const trace = await client.runs.trace.list(activeRunId, {
        resourceType: 'agent_turn',
        limit: 20,
      });
      assert(
        trace.data.some(
          (span) => span.resourceId === accepted.turnId && span.status === 'succeeded'
        )
      );
    } finally {
      if (conversationId) {
        await client.conversations.cancel(conversationId).catch(() => {});
      }
      if (fileId) await client.files.delete(fileId).catch(() => {});
      if (runtimeId) {
        await client.runtimes.stop(runtimeId).catch(() => {});
        await client.runtimes.delete(runtimeId, { force: true }).catch(() => {});
      }
      if (spaceId) await client.spaces.delete(spaceId).catch(() => {});
    }
  }
);
