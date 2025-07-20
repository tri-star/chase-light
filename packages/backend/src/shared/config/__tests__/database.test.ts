import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest"

const mockSend = vi.fn()

// 元の環境変数を保存
const originalEnv = {
  USE_AWS: process.env.USE_AWS,
  STAGE: process.env.APP_STAGE,
  AWS_REGION: process.env.AWS_REGION,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
}

// AWS SDK Mock
vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: vi.fn(() => ({
    send: mockSend,
  })),
  GetParameterCommand: vi.fn((params) => params),
}))

// 実際のimportはモック後に行う
const { getDatabaseConfig } = await import("../database")

describe("database config", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.APP_STAGE = "test"
    delete process.env.USE_AWS
    delete process.env.AWS_REGION
    delete process.env.DB_HOST
    delete process.env.DB_PORT
    delete process.env.DB_NAME
    delete process.env.DB_USER
    delete process.env.DB_PASSWORD
  })

  afterEach(() => {
    // 各テスト後にモックをクリア
    vi.clearAllMocks()

    // 環境変数をクリア
    process.env.APP_STAGE = "test"
    delete process.env.USE_AWS
    delete process.env.AWS_REGION
    delete process.env.DB_HOST
    delete process.env.DB_PORT
    delete process.env.DB_NAME
    delete process.env.DB_USER
    delete process.env.DB_PASSWORD
  })

  afterAll(() => {
    // すべてのテスト終了後にモックをリストア
    vi.restoreAllMocks()

    // 元の環境変数を復元
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value
      } else {
        delete process.env[key]
      }
    })
  })

  describe("ローカル環境", () => {
    it("環境変数からデータベース設定を取得する", async () => {
      process.env.USE_AWS = "false"
      process.env.DB_HOST = "localhost"
      process.env.DB_PORT = "5432"
      process.env.DB_NAME = "test_db"
      process.env.DB_USER = "postgres"
      process.env.DB_PASSWORD = "password"

      const config = await getDatabaseConfig()

      expect(config).toEqual({
        host: "localhost",
        port: 5432,
        name: "test_db",
        user: "postgres",
        password: "password",
      })
    })

    it("DB_PORTが未設定の場合はundefinedを返す", async () => {
      process.env.USE_AWS = "false"
      process.env.DB_HOST = "localhost"
      process.env.DB_NAME = "test_db"
      process.env.DB_USER = "postgres"
      process.env.DB_PASSWORD = "password"

      const config = await getDatabaseConfig()

      expect(config.port).toBeUndefined()
    })
  })

  describe("AWS環境", () => {
    beforeEach(() => {
      process.env.USE_AWS = "true"
      process.env.AWS_REGION = "us-east-1"
      process.env.APP_STAGE = "dev"
    })

    it("Parameter StoreからPostgreSQL URLを取得してパースする", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value:
            "postgresql://test.user@example.com:password123@db.example.com:5432/production_db?pgbouncer=true",
        },
      })

      const config = await getDatabaseConfig()

      expect(mockSend).toHaveBeenCalledWith({
        Name: "/dev/supabase/db_url",
        WithDecryption: true,
      })

      expect(config).toEqual({
        host: "db.example.com",
        port: 5432,
        name: "production_db",
        user: "test.user@example.com",
        password: "password123",
      })
    })

    it("AWS_REGIONが未設定の場合はエラーを投げる", async () => {
      delete process.env.AWS_REGION

      await expect(getDatabaseConfig()).rejects.toThrow(
        "AWS_REGION environment variable is required when USE_AWS is true",
      )
    })

    it("STAGEが未設定の場合はエラーを投げる", async () => {
      // @ts-expect-error APP_STAGEがランタイムで未定義な状態を再現するため
      delete process.env.APP_STAGE

      await expect(getDatabaseConfig()).rejects.toThrow(
        "STAGE environment variable is required when USE_AWS is true",
      )
    })

    it("ポート番号が未指定の場合はデフォルトの5432を使用する", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value: "postgresql://user:pass@host/db",
        },
      })

      const config = await getDatabaseConfig()

      expect(config.port).toBe(5432)
    })

    it("ユーザー名にドット(.)が含まれる場合も正しくパースする", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value: "postgresql://user.with.dots:password@host:5432/db",
        },
      })

      const config = await getDatabaseConfig()

      expect(config.user).toBe("user.with.dots")
    })

    it("URLエンコードされた文字を正しくデコードする", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value: "postgresql://user%40domain.com:password%21@host:5432/db",
        },
      })

      const config = await getDatabaseConfig()

      expect(config.user).toBe("user@domain.com")
      expect(config.password).toBe("password!")
    })

    it("Parameter Storeからの値が存在しない場合はエラーを投げる", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value: undefined,
        },
      })

      await expect(getDatabaseConfig()).rejects.toThrow(
        "Database URL parameter not found: /dev/supabase/db_url",
      )
    })

    it("不正なPostgreSQL URL形式の場合はエラーを投げる", async () => {
      mockSend.mockResolvedValue({
        Parameter: {
          Value: "invalid-url-format",
        },
      })

      await expect(getDatabaseConfig()).rejects.toThrow(
        "Invalid PostgreSQL URL format",
      )
    })
  })
})
