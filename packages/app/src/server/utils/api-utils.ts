import { isAxiosError } from 'axios'

export function createErrorResponse(e: unknown) {
  if (isAxiosError(e)) {
    switch (e.response?.status) {
      case 401:
        return {
          status: 401,
          body: 'Unauthorized',
        }
      case 403:
        console.log(e.response)
        return {
          status: 403,
          body: 'Forbidden',
        }
      case 404:
        console.log(e.response)
        return {
          status: 404,
          body: 'Not Found',
        }
      case 500:
        console.error(e.response)
        return {
          status: 500,
          body: 'API実行中にエラーが発生しました',
        }
      default:
        console.error(e.response)
        return {
          status: 500,
          body: '予期しないAPIエラーです',
        }
    }
  } else {
    console.error(e)
    return {
      status: 500,
      body: '予期しないエラーです',
    }
  }
}
