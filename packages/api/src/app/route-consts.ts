/*
      UPDATE: {
        DEFINITION: '/admin/admin-users/{id}',
        URL: (id: string) => `/admin/admin-users/${id}`,
      },

*/
export const ROUTES = {
  USERS: {
    SIGNUP_VIA_PROVIDER: {
      DEFINITION: "/users/signup-via-provider",
    },
  },
} as const
