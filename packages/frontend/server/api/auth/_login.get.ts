import crypto from 'crypto'
import { generateAuth0AuthUrl } from '~/server/utils/auth0'

export default defineEventHandler(async (event) => {
  // State パラメータを生成（CSRF対策）
  const state = crypto.randomBytes(16).toString('hex')

  // State をセッションに保存（一時的にクッキーに保存）
  setCookie(event, 'auth-state', state, {
    httpOnly: true,
    secure: process.env.APP_STAGE === 'prod',
    maxAge: 600, // 10分
    sameSite: 'lax',
  })

  // Auth0認証URLにリダイレクト
  const authUrl = await generateAuth0AuthUrl(state)

  await sendRedirect(event, authUrl)
})
