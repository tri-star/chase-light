export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // セッションをクリア
  await clearUserSession(event)

  // Auth0のログアウトURLを生成
  const returnTo = config.appHost + '/'
  const logoutUrl = `https://${config.public.auth0.domain}/v2/logout?client_id=${config.public.auth0.clientId}&returnTo=${returnTo}`

  // ログアウトURLにリダイレクト
  return {
    logoutUrl,
  }
})
