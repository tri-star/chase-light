import { getUserSession, updateUserSession } from '~/server/utils/session'
import { refreshAccessToken } from '~/server/utils/auth0'

// トークン更新を試みる閾値（ms）
const TOKEN_REFRESH_THRESHOLD_MS = 60 * 1000 // 1 minute

const EXCLUDED_PATH_PATTERNS: Array<string | RegExp> = [
  '/api/auth/login',
  '/api/auth/test-login',
  '/api/auth/callback',
]

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // APIでない場合は処理対象外
  if (!url.pathname.startsWith('/api/')) {
    return
  }

  // 除外パターンにマッチするパスはスキップ（ログイン・公開API・静的アセットなど）
  if (
    EXCLUDED_PATH_PATTERNS.some((pattern) =>
      typeof pattern === 'string'
        ? url.pathname.startsWith(pattern)
        : pattern.test(url.pathname)
    )
  ) {
    return
  }

  // セッション情報を取得
  const session = await getUserSession(event)

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No session found',
    })
  }

  // アクセストークンの有効期限をチェック
  if (session.accessTokenExpiresAt && session.refreshToken) {
    const now = new Date()
    const expiresAt = new Date(session.accessTokenExpiresAt)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS) {
      try {
        console.log('Access token is expiring soon, refreshing...', {
          userId: session.userId,
          expiresAt: expiresAt.toISOString(),
          timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
        })

        // リフレッシュトークンで新しいアクセストークンを取得
        const newTokens = await refreshAccessToken(session.refreshToken)

        if (!newTokens || !newTokens.access_token) {
          throw new Error('refreshAccessToken did not return tokens')
        }

        // 新しいトークンの有効期限を計算
        const newAccessTokenExpiresAt = new Date(
          Date.now() + (newTokens.expires_in || 0) * 1000
        )

        // セッションを更新
        const updatedSession = await updateUserSession(event, {
          accessToken: newTokens.access_token,
          accessTokenExpiresAt: newAccessTokenExpiresAt,
          // リフレッシュトークンが返された場合は更新（返されない場合は既存のものを維持）
          refreshToken: newTokens.refresh_token || session.refreshToken,
        })

        if (!updatedSession) {
          console.error('Failed to update session after token refresh', {
            userId: session.userId,
          })
          throw createError({
            statusCode: 401,
            statusMessage: 'Session update failed after token refresh',
          })
        }

        console.log('Access token refreshed successfully', {
          userId: session.userId,
          newExpiresAt: newAccessTokenExpiresAt.toISOString(),
        })
      } catch (error) {
        console.error('Failed to refresh access token:', error, {
          userId: session.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // リフレッシュトークンが無効な場合は401エラー
        throw createError({
          statusCode: 401,
          statusMessage: 'Token refresh failed - please login again',
        })
      }
    }
  }
})
