/**
 * Resilient fetch helper with automatic retry on transient network drops
 * (e.g., dev server restarts or momentary proxy resets) and AbortSignal support.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit & { retries?: number; retryDelayMs?: number }
): Promise<Response> {
  const { retries = 2, retryDelayMs = 450, signal: rawSignal, ...restInit } = init || {};
  const validSignal = typeof AbortSignal !== 'undefined' && rawSignal instanceof AbortSignal ? rawSignal : undefined;
  const fetchInit: RequestInit = validSignal ? { ...restInit, signal: validSignal } : restInit;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (validSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      const response = await fetch(input, fetchInit);
      // Retry transient 502/503/504 gateway errors on idempotent GETs
      const method = (fetchInit.method || 'GET').toUpperCase();
      if (
        method === 'GET' &&
        (response.status === 502 || response.status === 503 || response.status === 504) &&
        attempt < retries
      ) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err: any) {
      if (err?.name === 'AbortError' || fetchInit.signal?.aborted) {
        throw err;
      }
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError;
}
