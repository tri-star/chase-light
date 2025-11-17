import { TEST_USER_AUTH0_USER_ID_PREFIX } from "./auth"

/**
 * テスト用Authで許可されるユーザーIDのプレフィックス
 * 新しいテストユーザーを追加する場合はここにプレフィックスを加える
 */
export const TEST_AUTH_ALLOWED_PREFIXES = [
  TEST_USER_AUTH0_USER_ID_PREFIX,
] as const

/**
 * /api/auth/test-login でID指定が無い場合に使用するデフォルトのユーザーID
 */
export const TEST_AUTH_DEFAULT_USER_ID =
  `${TEST_USER_AUTH0_USER_ID_PREFIX}01` as const
