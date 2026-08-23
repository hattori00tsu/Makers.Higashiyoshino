const memory = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && now - hit.at < ttlMs) return Promise.resolve(hit.data as T);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = load()
    .then((data) => {
      memory.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function forget(prefix?: string) {
  if (!prefix) {
    memory.clear();
    return;
  }
  for (const key of [...memory.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`)) memory.delete(key);
  }
}
