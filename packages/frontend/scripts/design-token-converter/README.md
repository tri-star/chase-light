# Design Token Converter

W3C Design Tokens形式のJSONファイルからTailwind v4用のCSS変数とHTMLドキュメンテーションを生成するスクリプト群です。

## 概要

このツールは以下のファイルを生成します：

1. **design-tokens.css** - Tailwind v4で使用するCSS変数
2. **design-tokens-detailed.css** - コメント付き詳細版CSS変数
3. **tailwind.config.js** - Tailwind v4設定ファイル
4. **design-tokens-documentation.html** - 視覚的なデザイントークンドキュメント
5. **manifest.json** - 生成結果の概要情報

## 使用方法

### 基本的な実行

```bash
# デフォルトのパスで実行（design-tokens.json → generated/）
pnpm tsx scripts/design-token-converter/convert.ts

# カスタムパスを指定
pnpm tsx scripts/design-token-converter/convert.ts ./custom-tokens.json ./custom-output
```

### Node.jsから利用

```typescript
import { DesignTokenConverter } from './scripts/design-token-converter'

const converter = new DesignTokenConverter()
await converter.convert()
```

## アーキテクチャ

### コアモジュール

- **types.ts** - 型定義
- **token-parser.ts** - デザイントークンのパースと変換
- **tailwind-generator.ts** - Tailwind CSS関連ファイルの生成
- **html-generator.ts** - HTMLドキュメンテーションの生成
- **index.ts** - メインコンバーター

### 変換フロー

1. **Parse** - W3C Design TokensのJSONを読み込み
2. **Flatten** - ネストした構造をフラット化
3. **Convert** - CSS変数名に変換
4. **Resolve** - トークン参照（`{color.primitive.blue.500}`）を解決
5. **Generate** - 各種出力ファイルを生成

## 機能詳細

### トークン参照の解決

```json
{
  "color": {
    "primitive": {
      "blue": {
        "500": { "value": "oklch(53.992% 0.19058 257.48)" }
      }
    },
    "semantic": {
      "primary": {
        "bg": { "value": "{color.primitive.blue.500}" }
      }
    }
  }
}
```

`{color.primitive.blue.500}` のような参照が実際の値に解決されます。

### CSS変数の生成

```css
:root {
  --color-primitive-blue-500: oklch(53.992% 0.19058 257.48);
  --color-semantic-primary-bg: oklch(53.992% 0.19058 257.48);
}
```

### HTMLドキュメンテーション

生成されるHTMLには以下が含まれます：

- **カラーパレット** - 色見本とOkLCH値の表示
- **タイポグラフィスケール** - フォントサイズとサンプルテキスト
- **スペーシング** - 視覚的なサイズバー
- **シャドウ** - 実際の影効果のプレビュー
- **ボーダーラディウス** - 角丸のプレビュー

## テスト

```bash
# 全テスト実行
pnpm --filter frontend test

# 特定のテストファイルのみ
pnpm --filter frontend test scripts/design-token-converter/__tests__/token-parser.test.ts
```

### テストカバレッジ

- **TokenParser** - トークンの解析とフラット化
- **TailwindGenerator** - CSS/JS生成ロジック
- **HTMLGenerator** - HTMLドキュメント生成
- **DesignTokenConverter** - 統合テストとエラーハンドリング

## 型安全性

TypeScriptの厳格な型チェックにより、以下を保証しています：

- デザイントークンの構造検証
- 生成されるCSS変数名の一貫性
- トークン参照の解決可能性

## 拡張性

### 新しい出力形式の追加

```typescript
export class CustomGenerator {
  static generateCustomFormat(tokens: ParsedToken[]): string {
    // カスタム変換ロジック
  }
}
```

### 新しいトークンタイプの対応

```typescript
// types.ts で新しいタイプを定義
export interface CustomToken extends TokenValue {
  customProperty?: string
}
```

## パフォーマンス

- メモリ効率的なストリーミング処理
- 大規模デザインシステム対応（1000+トークン）
- 増分ビルド対応（変更されたトークンのみ処理）

## トラブルシューティング

### よくあるエラー

1. **ファイルが見つからない**
   ```
   デザイントークンファイルの読み込みに失敗しました
   ```
   → パスが正しいか確認

2. **JSON構文エラー**
   ```
   SyntaxError: Unexpected token
   ```
   → design-tokens.jsonの構文を確認

3. **循環参照エラー**
   ```
   Maximum call stack size exceeded
   ```
   → トークン参照に循環がないか確認

## 関連ドキュメント

- [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [OkLCH Color Space](https://developer.mozilla.org/docs/Web/CSS/color_value/oklch)