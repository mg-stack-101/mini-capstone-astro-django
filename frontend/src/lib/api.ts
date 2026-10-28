/** All private data stays behind the existing same-origin Django API. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      data?.message || `Request failed (${response.status}). Please try again.`,
      response.status,
    );
  if (data === null)
    throw new Error("We could not read the server response. Please try again.");
  return data as T;
}

async function requestJson<T>(
  endpoint: string,
  options: RequestInit,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  const external = options.signal;
  if (external?.aborted) cancel();
  else external?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await readResponse<T>(
      await fetch(endpoint, {
        ...options,
        credentials: "same-origin",
        signal: controller.signal,
      }),
    );
  } catch (error) {
    if (timedOut)
      throw new Error("This is taking longer than expected. Please try again.");
    throw error;
  } finally {
    clearTimeout(timer);
    external?.removeEventListener("abort", cancel);
  }
}

type Flight = {
  controller: AbortController;
  promise: Promise<unknown>;
  readers: number;
  settled: boolean;
};
const pending = new Map<string, Flight>();

/** Deduplicate simultaneous GETs only. No persisted or stale private-data cache. */
export function getJson<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted)
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  let flight = pending.get(endpoint);
  if (!flight) {
    const controller = new AbortController();
    flight = {
      controller,
      promise: Promise.resolve(),
      readers: 0,
      settled: false,
    };
    const current = flight;
    const cleanup = () => {
      current.settled = true;
      if (pending.get(endpoint) === current) pending.delete(endpoint);
    };
    current.promise = requestJson<T>(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    }).then(
      (value) => {
        cleanup();
        return value;
      },
      (error) => {
        cleanup();
        throw error;
      },
    );
    pending.set(endpoint, current);
  }
  const shared = flight;
  shared.readers += 1;
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return false;
      done = true;
      signal?.removeEventListener("abort", abort);
      shared.readers -= 1;
      if (!shared.settled && shared.readers === 0)
        queueMicrotask(() => {
          if (!shared.settled && shared.readers === 0) {
            shared.controller.abort();
            if (pending.get(endpoint) === shared) pending.delete(endpoint);
          }
        });
      return true;
    };
    const abort = () => {
      if (finish()) reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    shared.promise.then(
      (value) => {
        if (finish()) resolve(value as T);
      },
      (error) => {
        if (finish()) reject(error);
      },
    );
  });
}

function csrfCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const item = document.cookie
    .split("; ")
    .find((value) => value.startsWith("csrftoken="));
  if (!item) return undefined;
  try {
    return decodeURIComponent(item.slice("csrftoken=".length));
  } catch {
    return undefined;
  }
}
let csrfFlight: Promise<string> | null = null;

/** Read the fresh Django cookie after login rotation; fetch only when needed. */
export function getCsrfToken(provided?: string): Promise<string> {
  const token = provided || csrfCookie();
  if (token) return Promise.resolve(token);
  if (!csrfFlight)
    csrfFlight = getJson<{ csrfToken: string }>("/api/csrf/")
      .then((data) => {
        if (!data.csrfToken)
          throw new Error("Please refresh the page and try again.");
        return data.csrfToken;
      })
      .finally(() => {
        csrfFlight = null;
      });
  return csrfFlight;
}

export function resetClientRequests() {
  for (const flight of pending.values()) flight.controller.abort();
  pending.clear();
  csrfFlight = null;
}

export async function postForm<T = { message: string }>(
  endpoint: string,
  form: FormData,
  csrfToken?: string,
): Promise<T> {
  const token = await getCsrfToken(csrfToken);
  form.set("csrfmiddlewaretoken", token);
  return requestJson<T>(
    endpoint,
    {
      method: "POST",
      body: form,
      headers: { Accept: "application/json", "X-CSRFToken": token },
    },
    30_000,
  );
}
export async function patchJson<T>(
  endpoint: string,
  data: unknown,
): Promise<T> {
  const token = await getCsrfToken();
  return requestJson<T>(
    endpoint,
    {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": token,
      },
    },
    30_000,
  );
}
