import assert from 'node:assert/strict';
import test from 'node:test';

import { Bctrl } from '../../../src/index.js';

const shouldRun = process.env.BCTRL_E2E === '1' && Boolean(process.env.BCTRL_API_KEY);

test(
  'real v1 API can create a space and list files',
  { skip: shouldRun ? false : 'set BCTRL_E2E=1 and BCTRL_API_KEY' },
  async () => {
    const client = new Bctrl({
      apiKey: process.env.BCTRL_API_KEY,
      baseUrl: process.env.BCTRL_API_BASE_URL,
    });

    const space = await client.spaces.create({
      name: `sdk-v1-e2e-${Date.now()}`,
    });
    const files = await client.files.list({ spaceId: space.id, limit: 1 });

    assert.equal(typeof space.id, 'string');
    assert(Array.isArray(files.data));
  }
);
