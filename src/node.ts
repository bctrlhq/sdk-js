import { readFile } from 'node:fs/promises';
import { BctrlV1 } from './bctrl.js';
import type { V1ToolCreateRequest } from './types.js';

type V1CodeToolCreateRequest = Extract<
  V1ToolCreateRequest,
  { implementation: { type: 'code' } }
>;

export async function createHostedToolFromFile(
  client: BctrlV1,
  request: Omit<V1CodeToolCreateRequest, 'implementation'> & {
    implementation: Omit<V1CodeToolCreateRequest['implementation'], 'source'>;
    filePath: string;
  }
) {
  const source = await readFile(request.filePath, 'utf8');
  const { filePath: _filePath, implementation, ...rest } = request;
  return client.tools.create({
    ...rest,
    implementation: { ...implementation, source },
  });
}
