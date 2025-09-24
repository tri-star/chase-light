export type User = {
  id: string
  auth0UserId: string
  email: string
  name: string
  avatarUrl: string
  githubUsername: string | null
  timezone: string
  // NOTE: createdAt/updatedAtはDBでNOT NULL制約があるため必須
  createdAt: Date
  updatedAt: Date
}

// NOTE: domainフォルダ内のtsファイルには型定義の他、Entityに関するロジックを含んだ関数も定義する
