import 'h3'
import type { UserSession } from '~/server/utils/session'

declare module 'h3' {
  interface H3EventContext {
    session?: UserSession
  }
}
