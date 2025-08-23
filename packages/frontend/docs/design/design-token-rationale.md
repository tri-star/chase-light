# Design Token設計の根拠と背景

このドキュメントでは、`design-tokens.json`で定義された各トークンの設計意図と根拠を記録します。

## 全体構造

### W3C Design Tokens形式の採用理由
- 業界標準に準拠することで将来的な互換性を確保
- StyleDictionaryを使ったTailwind変換時の複雑なスクリプト回避
- 型安全性とツールサポートの恩恵

## Color（カラートークン）

### Primitive Colors
**OkLCH形式の採用理由:**
- より人間の知覚に近い色空間での一貫した明度・彩度調整
- 将来的なCSS Color Module Level 4対応
- デザインツールとの色相互性向上

**スケール設計（50-900）:**
- Tailwindのデフォルトスケールに準拠
- 50が最明色、900が最暗色の直感的な体系
- 中間値（500）をベースカラーとしたバランス設計

### Semantic Colors

#### Content Category
```json
"content": {
  "default": {
    "bg": "{color.primitive.white}",
    "text": "{color.primitive.gray.900}"
  }
}
```
**設計根拠:**
- ページ全体の基調色として高いコントラスト比を確保
- 長時間の読書に適した目に優しい組み合わせ

#### Surface Category
**Primary/Secondary/Outlined パターンの採用:**
- Material DesignとTailwind UIの設計パターンに準拠
- ボタン階層の明確な視覚的区別
- アクセシビリティガイドライン（WCAG 2.1 AA）準拠

**状態設計（default/disabled/hovered/pressed）:**
```json
"primary": {
  "hovered": {
    "bg": "{color.primitive.blue.600}",  // 1段階濃く
    "pressed": "{color.primitive.blue.700}"   // 2段階濃く
  }
}
```
- ユーザーフィードバックの段階的表現
- タッチデバイスでの操作感向上

#### Interactive Category
**Focus状態の特別扱い:**
```json
"focused": {
  "border": "{color.primitive.blue.500}"
}
```
- キーボードナビゲーションでのアクセシビリティ確保
- フォーカスリングとの連携考慮

#### Header/Sidebar/Dialog Categories
**グラス効果の実装:**
```json
"header": {
  "bg": "oklch(100% 0 none / 0.8)",  // 80%透明度
  "border": "oklch(87.585% 0.0123 247.97 / 0.2)"  // 20%透明度
}
```
**設計根拠:**
- モダンなUI表現の要求対応
- backdrop-blurとの組み合わせ前提
- 視認性とスタイリッシュさのバランス

#### Common Category
**Alert色の体系化:**
```json
"info/success/warn/alert": {
  "default": "100番台",    // 通常の情報表示
  "subtle": "50番台",      // 薄いバックグラウンド
  "inversed": "800番台"    // 強調表示用
}
```
**設計根拠:**
- 情報の重要度による視覚的階層化
- 複数コンポーネントでの一貫した表現

**Focus Ring設計:**
```json
"focus": {
  "width": "2px",
  "offset": "2px",
  "color": "{color.primitive.blue.500}"
}
```
- WCAG 2.1準拠のフォーカス表示
- ブラウザデフォルトより視認しやすい設定

## Typography（タイポグラフィ）

### Font Family
```json
"sans": [
  "\"Hiragino Sans\"",
  "\"Hiragino Kaku Gothic ProN\"",
  "\"Noto Sans CJK JP\"",
  // ...
]
```
**日本語優先の根拠:**
- 日本語アプリケーションでの文字品質優先
- macOS/Windows/Linuxでの最適表示確保
- CJK文字の適切なフォールバック

### Scale設計
**サイズ体系（xs-4xl）:**
- 1.125倍（Major Second）の音楽的比率採用
- 読みやすさを重視した行高設定
- 見出し階層の明確化

**Semantic Typography:**
```json
"heading-1": "{typography.scale.4xl}",
"body": "{typography.scale.base}",
"caption": "{typography.scale.xs}"
```
- 用途に応じた意味的分類
- リファクタリング時の一括変更対応

## Spacing & Size

### スケール設計
**4の倍数体系（4, 8, 16, 32, 64, 128）:**
- デザイングリッドとの整合性
- 開発者の記憶しやすさ
- 各種デバイスでの整数ピクセル表示

**固定値の追加:**
```json
"px": "1px",      // ボーダー用
"1/2": "50%",     // レスポンシブ用
"full": "100%"    // コンテナフル幅用
```

## Border & Radius

### Border Width
**1px基調の設計:**
- 高解像度ディスプレイでの細線表示
- 2px/4px/8pxは強調用途

### Border Radius
**段階的丸角:**
```json
"sm": "0.125rem",    // 微細な丸角
"default": "0.25rem", // 標準的な丸角  
"full": "9999px"     // 完全な円形
```
- UI要素の用途に応じた選択肢
- ブランドの視覚的統一感

## Shadow & Effects

### Shadow設計
**段階的影システム:**
```json
"sm": "軽い浮き上がり",
"default": "標準的な浮き上がり",
"lg": "明確な浮き上がり"
```
**色の統一:**
- 全影でblack（oklch値）を統一使用
- 透明度で段階表現

### Backdrop Blur
```json
"backdrop-blur": {
  "default": "8px",
  "lg": "16px"
}
```
**グラス効果の実装:**
- ヘッダー・ダイアログでの視覚効果
- パフォーマンスを考慮した適度な設定

## Transition

### Duration設計
**75ms-1000ms の体系:**
- 75ms: 即座のフィードバック用
- 150ms: 一般的なUI遷移用  
- 300ms-500ms: ページ遷移用

### Easing
**CSS標準準拠:**
- ease-in/ease-out/ease-in-outの定義
- 自然な動きの表現

### Property Groups
```json
"default": "color, background-color, border-color, ...",
"colors": "color, background-color, border-color, ..."
```
**パフォーマンス最適化:**
- 必要なプロパティのみアニメーション
- レンダリング負荷の軽減

## 今後の拡張可能性

1. **ダークモード対応**: semantic層での色の差し替え
2. **ブランドバリエーション**: primitiveレベルでの色相変更
3. **アクセシビリティ強化**: コントラスト比の動的調整
4. **レスポンシブ**: ブレイクポイント別のスケール展開

このトークン体系により、一貫性のあるデザインシステムの構築と、効率的な保守・拡張が可能になります。