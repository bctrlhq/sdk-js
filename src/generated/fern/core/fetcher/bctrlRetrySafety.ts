// Generated BCTRL transport policy. Do not edit.
export function mutationRetryLimit(method: string, headers: Headers, retries: number | undefined, body?: BodyInit): number | undefined {
    if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return retries;
    if (!headers.has("Idempotency-Key") || body instanceof ReadableStream) return 0;
    return retries;
}

function unknownOutcome(value: unknown, depth = 0): boolean {
    if (!value || typeof value !== "object" || depth > 8) return false;
    const object = value as Record<string, unknown>;
    return object.status === "unknown" || object.reasonClass === "unknown" || object.reasonClass === "outcome_unknown" ||
        Object.values(object).some((child) => unknownOutcome(child, depth + 1));
}

export async function hasUnknownOutcome(response: Response): Promise<boolean> {
    try { return unknownOutcome(await response.clone().json()); } catch { return false; }
}

export async function retryDelay(delay: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) throw signal.reason;
    await new Promise<void>((resolve, reject) => {
        const finish = () => { signal?.removeEventListener("abort", abort); resolve(); };
        const timer = setTimeout(finish, delay);
        const abort = () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); reject(signal?.reason); };
        signal?.addEventListener("abort", abort, { once: true });
    });
}
