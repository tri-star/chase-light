import { getUserSession } from './session'
import type { UserSession } from './session'

/**
 * AsyncLocalStorageからセッション情報を取得する
 * @returns セッション情報（取得できない場合はnull）
 */
export async function getSessionFromALS(): Promise<UserSession | null> {
  try {
    const event = useEvent()
    if (!event) {
      return null
    }

    return await getUserSession(event)
  } catch (error) {
    console.warn('Failed to get session from ALS:', error)
    return null
  }
}

/**
 * AsyncLocalStorageからアクセストークンを取得する
 * @returns アクセストークン（取得できない場合はnull）
 */
export async function getAccessTokenFromALS(): Promise<string | null> {
  const session = await getSessionFromALS()
  return session?.accessToken || null
}
