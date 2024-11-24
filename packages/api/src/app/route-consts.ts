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
    FETCH_SELF: {
      DEFINITION: "/users/self",
    },
  },
  FEEDS: {
    CREATE: {
      DEFINITION: "/feeds",
    },
    LIST: {
      DEFINITION: "/feeds",
    },
    LIST_ALL_LOGS: {
      DEFINITION: "/feed-logs",
    },
  },
} as const
