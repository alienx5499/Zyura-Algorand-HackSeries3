export const DRAFT_CHAIN_CONCURRENCY = Math.max(
  1,
  Math.min(
    12,
    parseInt(process.env.ZYURA_DRAFT_CHAIN_CONCURRENCY || "8", 10) || 8,
  ),
);

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  };
  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}
