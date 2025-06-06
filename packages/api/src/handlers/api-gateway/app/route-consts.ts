/*
      UPDATE: {
        DEFINITION: '/admin/admin-users/{id}',
        URL: (id: string) => `/admin/admin-users/${id}`,
      },

*/
export const ROUTES = {
  USERS: {
    SIGNUP_VIA_PROVIDER: {
      DEFINITION: '/users/signup-via-provider',
    },
    FETCH_SELF: {
      DEFINITION: '/users/self',
    },
  },
  FEEDS: {
    CREATE: {
      DEFINITION: '/feeds',
    },
    LIST: {
      DEFINITION: '/feeds',
    },
    FETCH: {
      DEFINITION: '/feeds/{feedId}',
      URL: (feedId: string) => `/feeds/${feedId}`,
    },
    DELETE: {
      DEFINITION: '/feeds/{feedId}',
      URL: (feedId: string) => `/feeds/${feedId}`,
    },
    LIST_ALL_LOGS: {
      DEFINITION: '/feed-logs',
    },
    VALIDATE_FEED_URL: {
      DEFINITION: '/feeds/validate-url',
    },
  },
  NOTIFICATIONS: {
    LIST: {
      DEFINITION: '/notifications',
    },
    MARK_AS_READ: {
      DEFINITION: '/notifications/mark-as-read',
    },
  },
} as const
