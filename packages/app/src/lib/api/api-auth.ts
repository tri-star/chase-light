import type { H3Event } from "h3"

/**
 * 有効期限が一定時間以上のアクセストークンを返す。
 * (SSR用)
 *
 * 内部的には、アクセストークンの有効期限が一定期間以内ならセッションに保持したトークンを返し、
 * 一定時間未満の場合はリフレッシュトークンを使って新しいアクセストークンを取得して返す。
 * リフレッシュトークンを利用できない場合は例外をスローする。
 */
export async function getActiveAccessToken(event: H3Event) {
  const session = await getUserSession(event)
  let token = session.secure?.accessToken

  if (!token) {
    token = await requestNewAccessToken(event)
  }

  const expirationSeconds = getExpirationSecondsFromToken(token ?? "") ?? 0
  console.log(`new token expirationSeconds: ${expirationSeconds}`)
  if (expirationSeconds < 60) {
    token = await requestNewAccessToken(event)
  }

  if (!token) {
    console.debug(
      `アクセストークンの更新に失敗しました: ${session.secure?.accessToken}`,
    )
    return undefined
  }

  return token
}

async function requestNewAccessToken(event: H3Event) {
  const config = useRuntimeConfig()
  const tokenEndpoint = `https://${config.oauth.auth0.domain}/oauth/token`

  const session = await getUserSession(event)
  if (!session.secure?.refreshToken) {
    return undefined
  }

  try {
    const response = await $fetch<{
      access_token: string
      id_token: string
      token_type: string
      expires_in: number
      scope: string
      refresh_token: string
    }>(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.oauth.auth0.clientId,
        client_secret: config.oauth.auth0.clientSecret,
        refresh_token: session.secure.refreshToken,
      }),
    })

    setUserSession(event, {
      secure: {
        accessToken: response.access_token,
        idToken: response.id_token,
        refreshToken: response.refresh_token,
      },
    })

    session.secure.accessToken = response.access_token
    session.secure.refreshToken = response.refresh_token
    console.debug("new token", session.secure.accessToken)
    return session.secure.accessToken
  } catch (e) {
    console.error(`トークンの再発行に失敗: ${e}`)
    return undefined
  }
}

export function getExpirationSecondsFromToken(token: string) {
  try {
    const [, payload] = token.split(".")
    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8"),
    )

    if (!decodedPayload.exp) {
      return undefined
    }

    const now = new Date().getTime() / 1000

    return decodedPayload.exp - now
  } catch (e) {
    console.debug(`トークンから有効期限を取得に失敗: ${token}`)
    return undefined
  }
}
