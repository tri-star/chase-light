# Lintエラーに対するトラブルシューティングガイド

## Honoのハンドラー関数の戻り値に関する型エラーが起きている場合

c.jsonの戻り値のステータスコードが、OpenAPIのレスポンス定義と一致しているか確認してみてください。

例えばOpenAPIのレスポンス定義が 200 | 400 | 401 | 404 | 500 の場合、
Honoのハンドラー関数の `c.json()` も同様のステータスコードを返す必要があります。

**よくあるNG例**

- 正常系(ステータスコード=200)のレスポンスが `c.json({ ... })` のようにステータスコードが省略されている
  - NG: `c.json({ ... })`
  - OK: `c.json({ ... }, 200)`
- ステータスコードがnumber型で指定されている
  - NG:
    ```typescript
    // someUseCase() の戻り値のstatusCodeがnumber型
    const result = ({ result, statusCode } = someUseCase());
    return c.json(result, statusCode);
    ```
  - OK:
    ```typescript
    // someUseCase() の戻り値のstatusCodeが200 | 400 | 401 | 404 | 500 のように具体的なUnionタイプになっている
    const result = ({ result, statusCode } = someUseCase());
    return c.json(result, statusCode);
    ```
