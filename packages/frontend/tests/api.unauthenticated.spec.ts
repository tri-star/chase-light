import { test, expect } from '@playwright/test'

test.describe('Unauthenticated API Access', () => {
  test('should reject access to protected API without authentication', async ({ request }) => {
    // 認証状態のないrequestコンテキストで直接APIにアクセス
    const response = await request.get('/api/protected/test')
    
    // 401 Unauthorizedが返されることを確認
    expect(response.status()).toBe(401)
  })

  test('should return null data for session endpoint without authentication', async ({ request }) => {
    const response = await request.get('/api/auth/session')
    
    // セッションエンドポイントは認証なしでも200を返し、data: nullで未認証を表現
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.data).toBeNull()
  })

  test('should reject access to GitHub user API without authentication', async ({ request }) => {
    const response = await request.get('/api/github/user')
    
    // 認証が必要なため401を期待
    expect(response.status()).toBe(401)
  })

  test('should reject access to GitHub repos API without authentication', async ({ request }) => {
    const response = await request.get('/api/github/repos')
    
    // 認証が必要なため401を期待  
    expect(response.status()).toBe(401)
  })
})
