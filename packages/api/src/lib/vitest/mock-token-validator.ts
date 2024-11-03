import { vi } from "vitest"
import type {
  TokenValidatorInterface,
  AccessTokenPayload,
  IdTokenPayload,
} from "@/features/auth/services/token-validator-interface"

export function createTokenValidatorMock(): TokenValidatorInterface {
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
