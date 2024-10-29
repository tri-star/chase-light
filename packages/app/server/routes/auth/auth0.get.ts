export default defineOAuthAuth0EventHandler({
  config: {
    connection: "github",
    scope: ["profile", "email"],
  },
  async onSuccess(event, { user, tokens }) {
    console.log("onSuccess", user, tokens)
    await setUserSession(event, {
      user: user,
    })
    return sendRedirect(event, "/")
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error)
    return sendRedirect(event, "/")
  },
})
