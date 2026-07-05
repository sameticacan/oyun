const lastRequestBySource = new Map<string, number>();
let queue = Promise.resolve();

export async function withSourceRateLimit<T>(source: string, task: () => Promise<T>): Promise<T> {
  if (source === "demo" || source === "manual") return task();
  const minimumInterval = Math.max(60_000, Number(process.env.SCRAPER_MIN_INTERVAL_MS ?? 60_000));
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const waitMs = Math.max(0, (lastRequestBySource.get(source) ?? 0) + minimumInterval - Date.now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastRequestBySource.set(source, Date.now());
    return await task();
  } finally {
    release();
  }
}
