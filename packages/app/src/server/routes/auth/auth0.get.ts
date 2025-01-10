export default defineOAuthAuth0EventHandler({
  config: {
    connection: 'github',
    scope: ['profile', 'email', 'openid', 'offline_access'],
  },
  async onSuccess(event, { user, tokens }) {
    console.log('onSuccess', user, tokens)
    await setUserSession(event, {
      user: user,
      secure: {
        accessToken: tokens['access_token'] ?? undefined,
        refreshToken: tokens['refresh_token'] ?? undefined,
        idToken: tokens['id_token'] ?? undefined,
      },
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
