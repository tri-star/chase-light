declare module "#auth-utils" {
  interface User {}

  interface UserSession {}

  interface SecureSessionData {
    accessToken: string | undefined
    refreshToken: string | undefined
    idToken: string | undefined
  }
}

export {}
