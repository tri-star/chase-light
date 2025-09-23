import type { TokenValidationResult } from "../../../../core/auth/types/jwt.types"

export interface JWTValidatorPort {
  validateAccessToken(token: string): Promise<TokenValidationResult>
  validateIdToken(token: string): Promise<TokenValidationResult>
}
