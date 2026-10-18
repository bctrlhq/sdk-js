import { readFile } from 'node:fs/promises';
import type { Api, BctrlClient } from '../index.js';

type V1CodeToolCreateRequest = Extract<
  Api.ToolCreateRequest,
  { implementation: { type: 'code' } }
>;

export async function createCodeToolFromFile(
  client: BctrlClient,
  request: Omit<V1CodeToolCreateRequest, 'implementation'> & {
    implementation: Omit<V1CodeToolCreateRequest['implementation'], 'source'>;
    filePath: string;
  }
) {
  const source = await readFile(request.filePath, 'utf8');
  const { filePath: _filePath, implementation, ...rest } = request;
  return client.tools.create({
    body: { ...rest, implementation: { ...implementation, source } },
  });
}
