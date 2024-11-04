import { vi } from "vitest"
import type {
  TokenParserInterface,
  AccessTokenPayload,
  IdTokenPayload,
} from "@/features/auth/services/token-parser-interface"

export function createTokenParserMock(): TokenParserInterface {
  return {
    parseAccessToken: vi.fn(
      async (_token: string): Promise<AccessTokenPayload> => {
        return {
          sub: "mockSub",
          email: "mock@example.com",
          email_verified: true,
          aud: ["mockAudience"],
        }
      },
    ),
    extractProviderId: vi.fn(async (_token: string): Promise<string> => {
      return "mockSub"
    }),
    parseIdToken: vi.fn(async (_token: string): Promise<IdTokenPayload> => {
      return {
        sub: "mockSub",
        email: "mock@example.com",
        email_verified: true,
        aud: ["mockAudience"],
        nickname: "mockNickname",
        name: "Mock User",
        picture: "https://example.com/mock.jpg",
        updated_at: "2023-01-01T00:00:00Z",
      }
    }),
  }
}
