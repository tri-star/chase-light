import { getActiveAccessToken } from '~/lib/api/api-auth'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    // Auth0のアクセストークンの期限が切れた場合に後続処理で正しくトークンが扱われるように、
    // SSRでリクエストを受け付けたタイミングで有効なトークンの再発行を試みる。
    // (ここで再発行しないと難しい。SSR中のuseFetch内でトークン再発行が起きても
    //  APIレスポンスにSet-Cookieが記録されるだけで、最終的なレスポンスのCookieは書き換えられない)
    await getActiveAccessToken(event)
    // console.log('onRequest hook token: ', token)
  })
})
