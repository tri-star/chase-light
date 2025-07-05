export type User = {
  id: string
  auth0UserId: string
  email: string
  name: string
  avatarUrl: string
  githubUsername: string | null
  timezone: string
  // NOTE: 日付型カラムの場合、"日付無し"はnullで表現する
  createdAt: Date | null
  updatedAt: Date | null
}

// NOTE: domainフォルダ内のtsファイルには型定義の他、Entityに関するロジックを含んだ関数も定義する
