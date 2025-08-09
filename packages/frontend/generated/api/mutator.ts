export const customFetch = <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  return fetch(url, options).then(async (response) => {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HTTP ${response.status}: ${error}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text() as Promise<T>
  })
}
