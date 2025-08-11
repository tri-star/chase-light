import { exchangeCodeForTokens, getUserInfo } from '~/server/utils/auth0'
import { setUserSession } from '~/server/utils/session'
import { postApiAuthSignup } from '~/generated/api/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { code, state, error } = query

  // エラーチェック
  if (error) {
    console.error('Auth0 callback error:', error)
    throw createError({
      statusCode: 400,
      statusMessage: `Authentication failed: ${error}`,
    })
  }

  // 必須パラメータのチェック
  if (!code || typeof code !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing authorization code',
    })
  }

  // State パラメータの検証（CSRF対策）
  const savedState = getCookie(event, 'auth-state')
  if (!savedState || savedState !== state) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid state parameter',
    })
  }

  try {
    // 認可コードをトークンに交換
    const tokens = await exchangeCodeForTokens(code)

    // ユーザー情報を取得
    const userInfo = await getUserInfo(tokens.access_token)

    // Backend APIでユーザー登録を実行
    try {
      console.log(`Backend API signup attempt for user: ${userInfo.sub}`)
      const signupResponse = await postApiAuthSignup({
        idToken: tokens.id_token,
      })

      const isExistingUser =
        signupResponse.status === 200 &&
        'alreadyExists' in signupResponse.data &&
        signupResponse.data.alreadyExists
      console.log(
        `Backend API signup successful for user: ${userInfo.sub}, status: ${signupResponse.status}${isExistingUser ? ' (existing user)' : ' (new user)'}`
      )
    } catch (backendError) {
      console.error(`Backend API signup failed for user: ${userInfo.sub}`, {
        error: backendError,
        userSub: userInfo.sub,
        userEmail: userInfo.email,
      })

      // Backend API呼び出し失敗時はセッション作成を中止してログイン失敗とする
      throw createError({
        statusCode: 500,
        statusMessage: 'User registration failed',
      })
    }

    // セッションを作成
    await setUserSession(event, {
      userId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.picture,
      provider: 'auth0',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      loggedInAt: new Date(),
    })

    // State クッキーを削除
    deleteCookie(event, 'auth-state')

    // ダッシュボードにリダイレクト
    await sendRedirect(event, '/')
  } catch (err) {
    console.error('Callback processing error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication processing failed',
    })
  }
})
