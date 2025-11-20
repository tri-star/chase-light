import { TEST_USER_AUTH0_USER_ID_PREFIX } from "./auth"

export interface TestUserDefinition {
  /** Auth0形式のユーザーID (例: test|test-user-01) */
  id: string
  /** 表示用の名前 */
  name: string
  /** ログイン時に使用するメールアドレス */
  email: string
  /** 表示用のGitHubユーザー名 */
  githubUsername: string
  /** アバターURL */
  avatarUrl: string
}

type SeedInput = Omit<TestUserDefinition, "id">

function createTestUser(suffix: string, data: SeedInput): TestUserDefinition {
  return {
    ...data,
    id: `${TEST_USER_AUTH0_USER_ID_PREFIX}${suffix}`,
  }
}

export const TEST_USERS: TestUserDefinition[] = [
  createTestUser("01", {
    name: "テストユーザー01",
    email: "test-user-01@example.com",
    githubUsername: "testuser01",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=1",
  }),
  createTestUser("02", {
    name: "テストユーザー02",
    email: "test-user-02@example.com",
    githubUsername: "testuser02",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=2",
  }),
  createTestUser("03", {
    name: "テストユーザー03",
    email: "test-user-03@example.com",
    githubUsername: "testuser03",
    avatarUrl: "https://api.dicebear.com/9.x/pixel-art/svg?seed=3",
  }),
] as const

const TEST_USER_MAP = new Map(TEST_USERS.map((user) => [user.id, user]))

/**
 * IDからテストユーザーを取得する
 */
export function findTestUserById(
  userId: string,
): TestUserDefinition | undefined {
  return TEST_USER_MAP.get(userId)
}
