# GitHub API Integration Documentation

## 概要

Chase Lightは、GitHub APIと統合された包括的なリポジトリ管理システムです。このドキュメントでは、GitHub API統合の完全な仕様、使用方法、エラーハンドリング、およびベストプラクティスについて説明します。

## アーキテクチャ概要

### デュアルAPI設計

Chase LightのGitHub統合は、2つの異なるAPIレイヤーで構成されています：

1. **Backend API** (`/api/datasource/*`): サーバー間通信用、アプリケーショントークンを使用
2. **Frontend API** (`/api/github/*`): ユーザー認証プロキシAPI、セッショントークンを使用

```mermaid
graph TD
    A[Frontend] --> B[Frontend API /api/github/*]
    A --> C[Backend API /api/datasource/*]
    B --> D[GitHub API]
    C --> D
    B -.-> E[User Session Token]
    C -.-> F[App Token]
```

## Backend API Endpoints

### 基本設定

- **Base URL**: `/api/datasource`
- **認証**: 環境変数 `GITHUB_TOKEN` 必須
- **レスポンス形式**: JSON (OpenAPI 3.0準拠)
- **エラーハンドリング**: 構造化エラーレスポンス
- **ドキュメント**: `/doc` (OpenAPI) および `/scalar` (Scalar UI)

### 利用可能なエンドポイント

#### 1. Watch済みリポジトリ一覧

```http
GET /api/datasource/repositories/watched
```

**パラメータ:**
- `page` (optional): ページ番号 (1-100, default: 1)
- `perPage` (optional): 1ページあたりの件数 (1-100, default: 30)

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10270250,
      "name": "react",
      "fullName": "facebook/react",
      "description": "The library for web and native user interfaces.",
      "htmlUrl": "https://github.com/facebook/react",
      "cloneUrl": "https://github.com/facebook/react.git",
      "stargazersCount": 228000,
      "watchersCount": 6900,
      "forksCount": 46000,
      "language": "JavaScript",
      "topics": ["javascript", "react", "frontend"],
      "isPrivate": false,
      "isFork": false,
      "isArchived": false,
      "defaultBranch": "main",
      "createdAt": "2013-05-24T16:15:54Z",
      "updatedAt": "2024-12-20T10:30:45Z",
      "pushedAt": "2024-12-20T08:15:30Z",
      "owner": {
        "login": "facebook",
        "id": 69631,
        "avatarUrl": "https://avatars.githubusercontent.com/u/69631?v=4",
        "htmlUrl": "https://github.com/facebook",
        "type": "Organization"
      },
      "license": {
        "key": "mit",
        "name": "MIT License",
        "spdxId": "MIT",
        "url": "https://api.github.com/licenses/mit"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 30,
    "total": 42,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 2. リポジトリ詳細

```http
GET /api/datasource/repositories/{owner}/{repo}
```

**パラメータ:**
- `owner` (path): GitHubユーザー名/組織名 (1-39文字、英数字とハイフン)
- `repo` (path): リポジトリ名 (1-100文字、英数字と.-_)

**使用例:**
```bash
curl -X GET "https://api.chase-light.com/api/datasource/repositories/facebook/react"
```

#### 3. リポジトリリリース一覧

```http
GET /api/datasource/repositories/{owner}/{repo}/releases
```

**パラメータ:**
- `owner`, `repo` (path): リポジトリ識別子
- `page`, `perPage` (query): ページネーション

**レスポンス例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123456789,
      "tagName": "v18.2.0",
      "name": "React 18.2.0",
      "body": "Release notes here...",
      "draft": false,
      "prerelease": false,
      "createdAt": "2022-06-14T17:00:00Z",
      "publishedAt": "2022-06-14T17:30:00Z",
      "author": {
        "login": "gaearon",
        "id": 810438,
        "avatarUrl": "https://avatars.githubusercontent.com/u/810438?v=4",
        "htmlUrl": "https://github.com/gaearon",
        "type": "User"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 30,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### 4. プルリクエスト一覧

```http
GET /api/datasource/repositories/{owner}/{repo}/pulls
```

**パラメータ:**
- `state` (query): "open", "closed", "all" (default: "open")
- `sort` (query): "created", "updated", "popularity", "long-running" (default: "created")
- `direction` (query): "asc", "desc" (default: "desc")
- `page`, `perPage` (query): ページネーション

**使用例:**
```bash
# 最新のオープンなプルリクエストを取得
curl -X GET "https://api.chase-light.com/api/datasource/repositories/facebook/react/pulls?state=open&sort=updated&direction=desc"

# 人気順でクローズされたプルリクエストを取得
curl -X GET "https://api.chase-light.com/api/datasource/repositories/facebook/react/pulls?state=closed&sort=popularity&direction=desc&page=1&perPage=10"
```

#### 5. イシュー一覧

```http
GET /api/datasource/repositories/{owner}/{repo}/issues
```

**パラメータ:**
- `state` (query): "open", "closed", "all" (default: "open")
- `sort` (query): "created", "updated", "comments" (default: "created")
- `direction` (query): "asc", "desc" (default: "desc")
- `since` (query): ISO 8601日時文字列 (この日時以降に更新されたイシュー)

**使用例:**
```bash
# 最近更新されたオープンなイシューを取得
curl -X GET "https://api.chase-light.com/api/datasource/repositories/facebook/react/issues?state=open&sort=updated&since=2024-01-01T00:00:00Z"

# コメント数順でイシューを取得
curl -X GET "https://api.chase-light.com/api/datasource/repositories/facebook/react/issues?sort=comments&direction=desc"
```

## Frontend API Endpoints

### 基本設定

- **Base URL**: `/api/github`
- **認証**: ユーザーセッション必須 (OAuth経由)
- **レスポンス形式**: GitHub APIレスポンスのプロキシ

### 利用可能なエンドポイント

#### 1. ユーザー情報取得

```http
GET /api/github/user
```

ログイン中のユーザーのGitHubプロフィール情報を取得します。

#### 2. リポジトリデータ取得

```http
GET /api/github/repos
```

**パラメータ:**
- `owner` (optional): ユーザー名/組織名
- `repo` (optional): リポジトリ名
- `page`, `per_page`: ページネーション

**動作パターン:**
- パラメータなし: ユーザーのリポジトリ一覧
- ownerのみ: 指定ユーザーのリポジトリ一覧
- owner + repo: 特定リポジトリの詳細

## エラーハンドリング

### エラータイプと対応

| エラータイプ | HTTPステータス | 説明 | 対処法 |
|-------------|---------------|------|-------|
| `GITHUB_AUTH_ERROR` | 401 | GitHub認証エラー | トークンの確認・再設定 |
| `GITHUB_RATE_LIMIT` | 429 | レート制限超過 | resetTime後に再試行 |
| `GITHUB_API_ERROR` | 400/404 | GitHub APIエラー | リクエストパラメータの確認 |
| `GITHUB_PARSE_ERROR` | 422 | レスポンス解析エラー | APIレスポンス形式の確認 |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー | サーバーログの確認 |

### エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "GITHUB_RATE_LIMIT",
    "message": "GitHub APIのレート制限に達しました",
    "details": {
      "resetTime": "2024-01-01T12:00:00Z",
      "remaining": 0
    }
  }
}
```

### レート制限エラーの特別対応

```json
{
  "success": false,
  "error": {
    "code": "GITHUB_RATE_LIMIT",
    "message": "GitHub APIのレート制限に達しました。2024-01-01T12:00:00Zまでお待ちください。",
    "details": {
      "resetTime": "2024-01-01T12:00:00Z",
      "remaining": 0
    }
  }
}
```

## ページネーション

### 基本仕様

- **ページ番号**: 1から開始
- **最大ページ**: 100 (GitHub API制限)
- **最小perPage**: 1
- **最大perPage**: 100 (GitHub API制限)
- **デフォルトperPage**: 30 (GitHub APIデフォルト)

### ページネーションメタデータ

#### Watch済みリポジトリ（総数付き）

```json
{
  "meta": {
    "page": 1,
    "perPage": 30,
    "total": 42,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### その他のエンドポイント（GitHub互換）

```json
{
  "meta": {
    "page": 1,
    "perPage": 30,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 認証設定

### Backend API認証

#### 環境変数設定

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### トークンの取得方法

1. **Personal Access Token (推奨)**:
   - GitHub Settings > Developer settings > Personal access tokens
   - 必要なスコープ: `public_repo` (パブリックリポジトリのみ) または `repo` (プライベートも含む)

2. **GitHub App Token**:
   - GitHub Apps作成後、Installation TokenをAPI経由で取得
   - より高いレート制限が適用される

#### スコープ要件

| エンドポイント | 必要スコープ | 説明 |
|---------------|-------------|------|
| `/repositories/watched` | `user` | ユーザーのwatch済みリポジトリ取得 |
| `/repositories/{owner}/{repo}` | `public_repo`* | リポジトリ詳細取得 |
| `/repositories/{owner}/{repo}/releases` | `public_repo`* | リリース一覧取得 |
| `/repositories/{owner}/{repo}/pulls` | `public_repo`* | プルリクエスト一覧取得 |
| `/repositories/{owner}/{repo}/issues` | `public_repo`* | イシュー一覧取得 |

*プライベートリポジトリにアクセスする場合は `repo` スコープが必要

### Frontend API認証

#### OAuth設定

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      auth0: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        redirectUri: process.env.AUTH0_REDIRECT_URI
      }
    },
    private: {
      auth0: {
        clientSecret: process.env.AUTH0_CLIENT_SECRET
      }
    }
  }
})
```

#### セッション管理

```typescript
// 使用例: Frontend APIでGitHubユーザー情報取得
const { data: user } = await $fetch('/api/github/user')
```

## 使用例とサンプルコード

### JavaScript/TypeScript例

#### 1. Watch済みリポジトリの取得

```typescript
// Backend API使用例
async function getWatchedRepositories(page = 1, perPage = 30) {
  try {
    const response = await fetch(`/api/datasource/repositories/watched?page=${page}&perPage=${perPage}`)
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error.message)
    }
    
    return result.data
  } catch (error) {
    console.error('Failed to fetch watched repositories:', error)
    throw error
  }
}

// 使用例
const repositories = await getWatchedRepositories(1, 10)
console.log(`Found ${repositories.length} repositories`)
```

#### 2. エラーハンドリング付きリポジトリ詳細取得

```typescript
async function getRepositoryDetails(owner: string, repo: string) {
  try {
    const response = await fetch(`/api/datasource/repositories/${owner}/${repo}`)
    const result = await response.json()
    
    if (!result.success) {
      switch (result.error.code) {
        case 'GITHUB_AUTH_ERROR':
          // 認証エラー: ログイン画面へリダイレクト
          window.location.href = '/login'
          break
        case 'GITHUB_RATE_LIMIT':
          // レート制限: リセット時刻を表示
          const resetTime = new Date(result.error.details.resetTime)
          alert(`レート制限に達しました。${resetTime.toLocaleString()}まで待機してください。`)
          break
        case 'GITHUB_API_ERROR':
          // APIエラー: リポジトリが見つからない等
          alert(`リポジトリエラー: ${result.error.message}`)
          break
        default:
          alert(`予期しないエラー: ${result.error.message}`)
      }
      return null
    }
    
    return result.data
  } catch (error) {
    console.error('Network error:', error)
    alert('ネットワークエラーが発生しました。')
    return null
  }
}
```

#### 3. ページネーション付きプルリクエスト一覧

```typescript
interface PullRequestFilter {
  state?: 'open' | 'closed' | 'all'
  sort?: 'created' | 'updated' | 'popularity' | 'long-running'
  direction?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

async function getPullRequests(
  owner: string, 
  repo: string, 
  filters: PullRequestFilter = {}
) {
  const params = new URLSearchParams()
  
  // フィルタをクエリパラメータに変換
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString())
    }
  })
  
  const url = `/api/datasource/repositories/${owner}/${repo}/pulls?${params}`
  const response = await fetch(url)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error.message)
  }
  
  return {
    pulls: result.data,
    pagination: result.meta
  }
}

// 使用例: 最新の未解決プルリクエストを10件取得
const { pulls, pagination } = await getPullRequests('facebook', 'react', {
  state: 'open',
  sort: 'updated',
  direction: 'desc',
  perPage: 10
})

console.log(`${pulls.length}件のプルリクエストを取得`)
console.log(`ページ ${pagination.page}/${Math.ceil(pagination.total / pagination.perPage)}`)
```

### React/Vue.js コンポーネント例

#### React Hook例

```typescript
import { useState, useEffect } from 'react'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  // ... その他のプロパティ
}

interface UseRepositoriesResult {
  repositories: Repository[]
  loading: boolean
  error: string | null
  loadMore: () => void
  hasMore: boolean
}

export function useRepositories(): UseRepositoriesResult {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchRepositories = async (pageNum: number, reset = false) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/datasource/repositories/watched?page=${pageNum}&perPage=20`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      setRepositories(prev => reset ? result.data : [...prev, ...result.data])
      setHasMore(result.meta.hasNext)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepositories(1, true)
  }, [])

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchRepositories(nextPage)
    }
  }

  return { repositories, loading, error, loadMore, hasMore }
}

// コンポーネントでの使用例
export function RepositoryList() {
  const { repositories, loading, error, loadMore, hasMore } = useRepositories()

  if (error) {
    return <div className="error">エラー: {error}</div>
  }

  return (
    <div>
      <h2>Watch中のリポジトリ</h2>
      {repositories.map(repo => (
        <div key={repo.id} className="repository-item">
          <h3>{repo.fullName}</h3>
          <p>{repo.description}</p>
          <div className="stats">
            ⭐ {repo.stargazersCount} | 
            🍴 {repo.forksCount} | 
            👁 {repo.watchersCount}
          </div>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? '読み込み中...' : 'さらに読み込む'}
        </button>
      )}
    </div>
  )
}
```

## パフォーマンス最適化

### 1. レート制限の最適化

```typescript
// レート制限を考慮した同期処理
async function batchRepositoryRequests(repositories: string[][]) {
  const results = []
  
  for (const [owner, repo] of repositories) {
    try {
      const result = await getRepositoryDetails(owner, repo)
      results.push(result)
      
      // 連続リクエスト間に適切な間隔を設ける
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      if (error.code === 'GITHUB_RATE_LIMIT') {
        const resetTime = new Date(error.details.resetTime)
        const waitTime = resetTime.getTime() - Date.now()
        
        console.log(`レート制限により${waitTime}ms待機します...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        
        // リトライ
        const result = await getRepositoryDetails(owner, repo)
        results.push(result)
      } else {
        throw error
      }
    }
  }
  
  return results
}
```

### 2. クライアントサイドキャッシュ

```typescript
// SimpleなメモリキャッシュImplementation
class RepositoryCache {
  private cache = new Map<string, { data: any, timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5分

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear() {
    this.cache.clear()
  }
}

const repositoryCache = new RepositoryCache()

async function getCachedRepositoryDetails(owner: string, repo: string) {
  const cacheKey = `${owner}/${repo}`
  const cached = repositoryCache.get(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const result = await getRepositoryDetails(owner, repo)
  repositoryCache.set(cacheKey, result)
  
  return result
}
```

## セキュリティ考慮事項

### 1. トークンセキュリティ

- **環境変数**: GitHubトークンは必ず環境変数で管理
- **スコープ最小化**: 必要最小限のスコープのみ付与
- **ローテーション**: 定期的なトークンの更新
- **ログ出力禁止**: トークンをログに出力しない

```typescript
// ❌ ダメな例: トークンをハードコード
const token = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

// ✅ 良い例: 環境変数使用
const token = process.env.GITHUB_TOKEN
if (!token) {
  throw new Error('GITHUB_TOKEN environment variable is required')
}
```

### 2. 入力値検証

```typescript
// パスパラメータのサニタイズ
function validateRepositoryParams(owner: string, repo: string) {
  // GitHubの仕様に基づく検証
  const ownerRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  const repoRegex = /^[a-z\d._-]{1,100}$/i
  
  if (!ownerRegex.test(owner)) {
    throw new Error('Invalid owner name format')
  }
  
  if (!repoRegex.test(repo)) {
    throw new Error('Invalid repository name format')
  }
}
```

### 3. レスポンスサニタイズ

```typescript
// XSS対策: HTMLエスケープ
function sanitizeRepositoryData(repository: any) {
  return {
    ...repository,
    description: repository.description ? escapeHtml(repository.description) : null,
    // その他のテキストフィールドも同様に処理
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 認証エラー (401)

**症状**: `GITHUB_AUTH_ERROR` が発生

**原因と解決方法**:
- トークンが設定されていない → `GITHUB_TOKEN` 環境変数を設定
- トークンが無効 → 新しいトークンを生成し直す
- スコープが不足 → 必要なスコープを付与したトークンに更新

```bash
# 環境変数確認
echo $GITHUB_TOKEN

# 正しい設定例
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 2. レート制限エラー (429)

**症状**: `GITHUB_RATE_LIMIT` が発生

**原因**: GitHub APIの制限を超過
- 未認証: 60リクエスト/時間
- 認証済み: 5000リクエスト/時間

**解決方法**:
- リクエスト頻度を調整
- 認証済みトークンの使用
- GitHub Appトークンの検討（より高い制限）

```typescript
// レート制限情報の確認
if (error.code === 'GITHUB_RATE_LIMIT') {
  console.log('Reset time:', error.details.resetTime)
  console.log('Remaining:', error.details.remaining)
}
```

#### 3. パースエラー (422)

**症状**: `GITHUB_PARSE_ERROR` が発生

**原因**: GitHub APIレスポンスの形式変更

**解決方法**:
- GitHub API仕様の確認
- スキーマ定義の更新
- ログでレスポンス内容を確認

#### 4. リポジトリが見つからない (404)

**症状**: `GITHUB_API_ERROR` でstatus 404

**原因**:
- リポジトリ名の誤入力
- プライベートリポジトリにアクセス権限なし
- リポジトリが削除済み

**解決方法**:
- リポジトリ名の確認
- アクセス権限の確認
- 適切なスコープのトークン使用

## 制限事項と今後の拡張

### 現在の制限事項

1. **エンドポイント範囲**: リポジトリ、リリース、PR、イシューのみ
2. **リアルタイム更新**: Webhookサポートなし
3. **検索機能**: 基本的なフィルタリングのみ
4. **バッチ処理**: 大量データの一括取得機能なし
5. **キャッシュ**: サーバーサイドキャッシュ未実装

### 拡張予定機能

1. **Webhook統合**: リアルタイム更新対応
2. **GraphQL API**: より効率的なデータ取得
3. **高度検索**: GitHub Search API統合
4. **バッチAPI**: 複数リポジトリの一括取得
5. **オフライン対応**: データキャッシュとオフライン機能

## サポートとリソース

### ドキュメントリンク

- **OpenAPI仕様**: `/doc`
- **インタラクティブAPI**: `/scalar`
- **GitHub API公式**: https://docs.github.com/en/rest
- **プロジェクト構成**: `/packages/backend/CLAUDE.md`

### 開発者向けリソース

- **型定義**: `/packages/backend/src/features/dataSource/schemas/`
- **テストケース**: `/packages/backend/src/features/dataSource/presentation/__tests__/`
- **使用例**: 本ドキュメントのサンプルコード参照

### 問題報告

バグや機能要望は、プロジェクトのIssue管理システムで報告してください。報告時は以下の情報を含めてください：

- エラーメッセージの詳細
- 再現手順
- 期待する動作
- 使用環境（Node.js版、ブラウザ等）

---

**最終更新**: 2024年12月22日  
**バージョン**: v1.0.0  
**メンテナー**: Chase Light Development Team