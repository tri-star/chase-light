import { useAuth0 } from '@auth0/auth0-vue'

export const useAuth = () => {
  const { 
    loginWithRedirect, 
    logout, 
    user, 
    isAuthenticated, 
    isLoading,
    getAccessTokenSilently 
  } = useAuth0()

  const login = async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: `${window.location.origin}/callback`
      }
    })
  }

  const logoutUser = async () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  const getAccessToken = async () => {
    try {
      return await getAccessTokenSilently()
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    login,
    logout: logoutUser,
    getAccessToken
  }
}