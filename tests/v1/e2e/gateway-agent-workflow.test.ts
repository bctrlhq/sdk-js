import assert from 'node:assert/strict';
import test from 'node:test';

import { Bctrl } from '../../../src/index.js';

const shouldRun = process.env.BCTRL_E2E === '1' && Boolean(process.env.BCTRL_API_KEY);
const AI_MODEL = 'deepseek/deepseek-v4.1-flash';
const TERMINAL = new Set(['succeeded', 'failed', 'canceled', 'unknown', 'awaiting_input']);

test(
  'SDK drives files, a gateway browser, a Tool call and an Agent Task end to end',
  { skip: shouldRun ? false : 'set BCTRL_E2E=1 and BCTRL_API_KEY', timeout: 600_000 },
  async () => {
    const client = new Bctrl({
      token: process.env.BCTRL_API_KEY!,
      baseUrl: process.env.BCTRL_API_BASE_URL?.replace(/\/v1\/?$/, ''),
    });

    let spaceId: string | undefined;
    let runtimeId: string | undefined;
    let agentId: string | undefined;
    let taskId: string | undefined;
    let fileId: string | undefined;

    try {
      const space = await client.spaces.create({ name: `sdk-agent-e2e-${Date.now()}` });
      const currentSpaceId = space.id;
      spaceId = currentSpaceId;

      const file = await client.files.upload({ spaceId: currentSpaceId, file: new Blob(['SDK gateway workflow fixture\n'], { type: 'text/plain' }), filename: 'sdk-workflow-fixture.txt', path: 'e2e/sdk-workflow-fixture.txt', metadata: JSON.stringify({ suite: 'sdk-gateway-e2e' }) });
      fileId = file.id;

      const files = await client.files.list({ spaceId: currentSpaceId, limit: 100 });
      assert(files.data.some((entry) => entry.id === file.id));

      const content = await client.files.content({ fileId: file.id });
      assert.equal(new TextDecoder().decode(await content.arrayBuffer()), 'SDK gateway workflow fixture\n');

      const renamedFile = await client.files.update({ fileId: file.id, filename: 'sdk-workflow-fixture-renamed.txt' });
      assert.equal(renamedFile.filename, 'sdk-workflow-fixture-renamed.txt');

      const runtime = await client.browsers.create({ spaceId: currentSpaceId, name: `sdk-agent-runtime-${Date.now()}`, headless: true, wait: 60 });
      runtimeId = runtime.id;

      const started = runtime.currentRun;
      assert.ok(started);
      assert.equal(started.resourceId, runtime.id);
      assert.equal(started.status, 'active');

      const opened = await client.tools.calls.create({ toolRef: 'browser.pages.open', input: { url: 'https://example.com' }, runtimeId: runtime.id, wait: 30 });
      assert.equal(opened.status, 'succeeded');

      const agent = await client.agents.create({ spaceId: currentSpaceId, name: `sdk-reader-${Date.now()}`, model: AI_MODEL,
        instructions: 'You operate a web browser through your browser tool. Be brief.',
        scope: { spaces: [], capabilities: ['browsers.create', 'cdp', 'computer'], maxConcurrentRuntimes: 1, budgetUsd: 1 } });
      agentId = agent.id;

      const accepted = await client.tasks.create({ agent: agent.id,
        input: 'Open https://example.com and report the main heading of the page.',
        outputSchema: { type: 'object', properties: { heading: { type: 'string' } }, required: ['heading'] } });
      taskId = accepted.id;
      assert.equal(accepted.status, 'queued');

      let task = accepted;
      const deadline = Date.now() + 540_000;
      while (!TERMINAL.has(task.status) && Date.now() < deadline) task = await client.tasks.get({ taskId: accepted.id, wait: 30 });
      assert.equal(task.status, 'succeeded');
      assert.match(String((task.output as { heading?: unknown } | null)?.heading), /example domain/i);
      assert.equal(task.runs.length, 1);

      const run = await client.runs.get({ runId: task.runs[0]!, include: 'usage' });
      assert.equal(run.taskId, accepted.id);
    } finally {
      if (taskId) await client.tasks.cancel({ taskId }).catch(() => {});
      if (agentId) await client.agents.delete({ agentId }).catch(() => {});
      if (fileId) await client.files.delete({ fileId: fileId }).catch(() => {});
      if (runtimeId) {
        await client.browsers.stop({ browserId: runtimeId }).catch(() => {});
        await client.browsers.delete({ browserId: runtimeId }).catch(() => {});
      }
      if (spaceId) await client.spaces.delete({ spaceId: spaceId }).catch(() => {});
    }
  }
);
