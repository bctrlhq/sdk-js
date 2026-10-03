import type { WaitOptions } from './browserHelpers.js';

/** Poll reads only; unknown is a terminal outcome. */
export async function waitFor<T extends { status: string }>(read: () => Promise<T>, options: WaitOptions & { intervalMs?: number } = {}): Promise<T> {
  const deadline = Date.now() + (options.timeoutMs ?? 120000);
  while (true) {
    options.signal?.throwIfAborted();
    const result = await read();
    if (['succeeded', 'failed', 'canceled', 'unknown', 'awaiting_input', 'ended'].includes(result.status)) return result;
    if (Date.now() >= deadline) throw new Error('Timed out waiting for an outcome');
    await new Promise((resolve) => setTimeout(resolve, Math.min(options.intervalMs ?? 250, Math.max(0, deadline - Date.now()))));
  }
}
