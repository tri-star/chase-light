# エラーハンドリングガイド

## 概要

このドキュメントは、`packages/backend`におけるAPIのエラーハンドリング戦略について説明します。一貫したエラーレスポンスを提供し、デバッグとクライアント側の実装を容易にすることを目的とします。

## 基本方針

-   **Presentation層での集約**: エラーハンドリングは、原則として`presentation`層に集約します。`service`層や`repository`層では、エラーが発生した場合、例外をスローするか、`null`を返却します。
-   **HTTPステータスコード**: 標準的なHTTPステータスコードを適切に使用します。
    -   `200 OK`: 成功
    -   `201 Created`: リソース作成成功
    -   `400 Bad Request`: バリデーションエラーなど、クライアント側のリクエストに問題がある場合
    -   `401 Unauthorized`: 認証が必要なリソースへのアクセスに失敗した場合
    -   `404 Not Found`: リソースが見つからない場合
    -   `500 Internal Server Error`: サーバー内部で予期せぬエラーが発生した場合
-   **統一されたエラーレスポンス形式**: エラーレスポンスは、以下の統一されたJSON形式で返却します。

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

## 実装

`presentation/shared/error-handling.ts` に、エラーハンドリングのための共通ユーティリティが定義されています。

### `handleError`関数

各ルートハンドラの`catch`ブロックで使用されるメインのエラーハンドリング関数です。

-   `HTTPException`はそのまま再スローします。
-   `Error`インスタンスの場合、メッセージ内容に基づいてバリデーションエラー（400）か内部エラー（500）かを判断します。
-   その他の予期せぬエラーはすべて内部エラー（500）として処理します。

```typescript
// 使用例
try {
  // ...処理
} catch (error) {
  return handleError(c, error, "処理名");
}
```

### `createErrorResponse`関数

標準的なエラーレスポンスオブジェクトを生成します。

### 固有のエラーレスポンス

-   **`userNotFoundResponse`**: ユーザーが見つからない場合の404エラーを返却します。
-   **`authenticationErrorResponse`**: 認証失敗時の401エラーを返却します。

## エラーの種類と対応

| エラーの種類 | レイヤー | 対応方法 | HTTPステータス | エラーコード例 |
| :--- | :--- | :--- | :--- | :--- |
| **リソースが見つからない** | Service | `null`を返却 | `404` | `USER_NOT_FOUND` |
| **バリデーションエラー** | Service | `Error`をスロー | `400` | `VALIDATION_ERROR` |
| **認証エラー** | Middleware | `HTTPException`をスロー | `401` | `AUTHENTICATION_ERROR` |
| **データベースエラー** | Repository | `Error`をスロー | `500` | `INTERNAL_ERROR` |
| **予期せぬエラー** | - | - | `500` | `INTERNAL_ERROR` |
