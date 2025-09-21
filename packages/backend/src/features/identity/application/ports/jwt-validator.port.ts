import type { TokenValidationResult } from "../../../../core/auth"

export interface JwtValidatorPort {
  validateAccessToken(token: string): Promise<TokenValidationResult>
  validateIdToken(token: string): Promise<TokenValidationResult>
}

// REVIEW: 以下の型は不要そうです。環境に応じたJwtValidatorを生成出来るように、
//         src/features/identity/infra/adapters/jwt-validator/jwt-validator.factory.ts の createJwtValidator関数のシグネチャをこのファイルでエクスポートしてください。
//         (JwtValidatorを利用する各ファイルがinfra層に依存しないようにするため)
export type JwtValidatorFactory = () => JwtValidatorPort
