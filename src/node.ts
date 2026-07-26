import { readFile } from 'node:fs/promises';
import { BctrlV1 } from './bctrl.js';
import type { V1ToolCreateRequest } from './types.js';

type V1HostedToolCreateRequest = Extract<V1ToolCreateRequest, { executionType: 'hosted' }>;

export async function createHostedToolFromFile(
  client: BctrlV1,
  request: Omit<V1HostedToolCreateRequest, 'source'> & { filePath: string }
) {
  const source = await readFile(request.filePath, 'utf8');
  const { filePath: _filePath, ...rest } = request;
  return client.tools.create({ ...rest, source });
}
