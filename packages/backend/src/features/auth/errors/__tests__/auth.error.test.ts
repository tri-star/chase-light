/**
 * Auth Error Tests
 */
import { describe, it, expect } from "vitest"
import { AuthError, AuthErrorCode } from "../auth.error"

describe("AuthError", () => {
  describe("constructor", () => {
    it("should create error with correct properties", () => {
      const error = new AuthError({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message: "Token has expired",
        httpStatus: 401,
        details: { expiredAt: new Date() },
      })

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AuthError)
      expect(error.name).toBe("AuthError")
      expect(error.code).toBe(AuthErrorCode.TOKEN_EXPIRED)
      expect(error.message).toBe("Token has expired")
      expect(error.httpStatus).toBe(401)
      expect(error.details).toBeDefined()
    })
  })

  describe("static factory methods", () => {
    it("should create tokenMissing error", () => {
      const error = AuthError.tokenMissing()

      expect(error.code).toBe(AuthErrorCode.TOKEN_MISSING)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Authorization token is missing")
    })

    it("should create tokenExpired error with expiration date", () => {
      const expiredAt = new Date()
      const error = AuthError.tokenExpired(expiredAt)

      expect(error.code).toBe(AuthErrorCode.TOKEN_EXPIRED)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token has expired")
      expect(error.details?.expiredAt).toBe(expiredAt)
    })

    it("should create tokenInvalid error with custom reason", () => {
      const reason = "Custom invalid reason"
      const error = AuthError.tokenInvalid(reason)

      expect(error.code).toBe(AuthErrorCode.TOKEN_INVALID)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe(reason)
    })

    it("should create tokenInvalid error with default message", () => {
      const error = AuthError.tokenInvalid()

      expect(error.code).toBe(AuthErrorCode.TOKEN_INVALID)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token is invalid")
    })

    it("should create tokenMalformed error", () => {
      const error = AuthError.tokenMalformed()

      expect(error.code).toBe(AuthErrorCode.TOKEN_MALFORMED)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token format is malformed")
    })

    it("should create invalidSignature error", () => {
      const error = AuthError.invalidSignature()

      expect(error.code).toBe(AuthErrorCode.INVALID_SIGNATURE)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token signature is invalid")
    })

    it("should create invalidAudience error with details", () => {
      const expected = "expected-audience"
      const actual = "actual-audience"
      const error = AuthError.invalidAudience(expected, actual)

      expect(error.code).toBe(AuthErrorCode.INVALID_AUDIENCE)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token audience is invalid")
      expect(error.details?.expected).toBe(expected)
      expect(error.details?.actual).toBe(actual)
    })

    it("should create invalidIssuer error with details", () => {
      const expected = "https://expected-issuer.com/"
      const actual = "https://actual-issuer.com/"
      const error = AuthError.invalidIssuer(expected, actual)

      expect(error.code).toBe(AuthErrorCode.INVALID_ISSUER)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token issuer is invalid")
      expect(error.details?.expected).toBe(expected)
      expect(error.details?.actual).toBe(actual)
    })

    it("should create invalidAlgorithm error", () => {
      const error = AuthError.invalidAlgorithm()

      expect(error.code).toBe(AuthErrorCode.INVALID_ALGORITHM)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token algorithm is invalid")
    })

    it("should create tokenNotActive error with date", () => {
      const notActiveBefore = new Date()
      const error = AuthError.tokenNotActive(notActiveBefore)

      expect(error.code).toBe(AuthErrorCode.TOKEN_NOT_ACTIVE)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe("Token is not yet active")
      expect(error.details?.notActiveBefore).toBe(notActiveBefore)
    })

    it("should create missingClaims error with claim name", () => {
      const claimName = "sub"
      const error = AuthError.missingClaims(claimName)

      expect(error.code).toBe(AuthErrorCode.MISSING_CLAIMS)
      expect(error.httpStatus).toBe(400)
      expect(error.message).toBe(`Required claim is missing: ${claimName}`)
      expect(error.details?.claim).toBe(claimName)
    })

    it("should create missingClaims error without claim name", () => {
      const error = AuthError.missingClaims()

      expect(error.code).toBe(AuthErrorCode.MISSING_CLAIMS)
      expect(error.httpStatus).toBe(400)
      expect(error.message).toBe("Required claim is missing")
      expect(error.details?.claim).toBeUndefined()
    })

    it("should create jwksError with custom reason", () => {
      const reason = "Connection timeout"
      const error = AuthError.jwksError(reason)

      expect(error.code).toBe(AuthErrorCode.JWKS_ERROR)
      expect(error.httpStatus).toBe(500)
      expect(error.message).toBe(`JWKS error: ${reason}`)
    })

    it("should create jwksError with default message", () => {
      const error = AuthError.jwksError()

      expect(error.code).toBe(AuthErrorCode.JWKS_ERROR)
      expect(error.httpStatus).toBe(500)
      expect(error.message).toBe("JWKS error: Failed to retrieve signing key")
    })

    it("should create validationError with custom reason", () => {
      const reason = "Custom validation error"
      const error = AuthError.validationError(reason)

      expect(error.code).toBe(AuthErrorCode.VALIDATION_ERROR)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe(`Token validation error: ${reason}`)
    })

    it("should create validationError with default message", () => {
      const error = AuthError.validationError()

      expect(error.code).toBe(AuthErrorCode.VALIDATION_ERROR)
      expect(error.httpStatus).toBe(401)
      expect(error.message).toBe(
        "Token validation error: Unknown validation error",
      )
    })
  })
})
