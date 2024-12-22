import { beforeEach, describe, expect, test, vi } from "vitest"
import { getExpirationSecondsFromToken } from "~/lib/api/api-auth"

describe("getExpirationSecondsFromToken", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01 00:00:00"))
  })

  test.each([
    {
      title:
        "expを含んだトークンからタイムスタンプ(秒)を抜き出し、現在時刻との差分を返すこと",
      token: "xxx.eyJleHAiOjE3MDQwMzQ4NjB9.xxx",
      expected: 60,
    },
    {
      title: "JWTのペイロード部分が有効なJSON出ない場合はundefinedを返す",
      token: "xxx.yyy.xxx",
      expected: undefined,
    },
    {
      title: ".区切りで分割出来ない場合はundefinedを返す",
      token: "xxxyyyxxx",
      expected: undefined,
    },
  ])(`$title`, ({ token, expected }) => {
    expect(getExpirationSecondsFromToken(token)).toBe(expected)
  })
})
