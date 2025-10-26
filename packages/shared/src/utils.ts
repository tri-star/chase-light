// Shared utility functions

const DEFAULT_CHUNK_SIZE = 10

export async function promiseAllSettledChunked<T, R>(
  items: readonly T[],
  handler: (item: T) => Promise<R>,
  chunkSize = DEFAULT_CHUNK_SIZE,
): Promise<PromiseSettledResult<R>[]> {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0")
  }

  if (items.length === 0) {
    return []
  }

  const results: PromiseSettledResult<R>[] = []

  for (let index = 0; index < items.length; index += chunkSize) {
    const chunk = items.slice(index, index + chunkSize)
    const chunkResults = await Promise.allSettled(
      chunk.map((item) => handler(item)),
    )
    results.push(...chunkResults)
  }

  return results
}
