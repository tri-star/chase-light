export type User = {
  id: string
  auth0UserId: string
  email: string
  name: string
  avatarUrl: string
  githubUsername: string | null
  timezone: string
  createdAt: Date
  updatedAt: Date
}

// NOTE: domainフォルダ内のtsファイルには型定義の他、Entityに関するロジックを含んだ関数も定義する
