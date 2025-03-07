# Chase Light Commands and Style Guide

## レビューにおける基本方針

- レビューコメントは日本語でお願いします。
- PRのコミットに注目してください。
  - "WIP"などの作業途中のコミットの残りと思われるものがある場合は指摘してください
  - "test"などコミットのコメントからコミット内容が全く判別出来ないコミットを指摘してください

## TypeScriptのコーディング規約

### 命名規則

| 要素                           | ケース           | 例                  | 備考                                                                             |
| ------------------------------ | ---------------- | ------------------- | -------------------------------------------------------------------------------- |
| ファイル名                     | kebab-case       | `sample-file.ts`    |                                                                                  |
| Vue.jsコンポーネントファイル名 | PascalCase       | `SomeComponent.vue` | Nuxt.jsのpagesフォルダ(/packages/app/src/pages)内は例外です(URLに関係するため)。 |
| フォルダ名                     | kebab-case       | `sample-folder`     |                                                                                  |
| 変数名                         | camelCase        | `sampleVariable`    |                                                                                  |
| 定数名                         | UPPER_SNAKE_CASE | `SAMPLE_CONSTANT`   |                                                                                  |
| クラス名                       | PascalCase       | `SampleClass`       |                                                                                  |
| インターフェース名             | PascalCase       | `SampleInterface`   |                                                                                  |
| 型名                           | PascalCase       | `SampleType`        |                                                                                  |

### 関数宣言

- 基本的にはfunction宣言を利用し、アロー関数は必要な場面でのみ利用します。

## Typeとinterfaceの使い分け

- typeを優先します。
- OOPの文脈でクラスを定義する際、クラスのインターフェースを定義する目的ではinterfaceを利用します。

## null と undefinedの使い分け

- 本プロジェクトではnull と undefinedどちらかで統一することはしません。
  - ただし、1つの関数や型の中でnullとundefinedを混在させることは理由がない限り避けるようにします。

## プロジェクトのフォルダ構造

以下がこのプロジェクトのフォルダ構造です。

- それぞれのフォルダの目的に合わない使い方でファイルやフォルダが追加されている場合、レビュー時に指摘してください。
- packages/common配下にはapi/appで共通化出来るものを集めようとしています。
  これに剃っていないものがあれば、提案をお願いします。
  - 例えばエラーコードなどのコード類の値や定数、ユーティリティ関数はapi/app間で共通であるべきです。
  - 一方で、オブジェクトの型定義/スキーマ定義はapi/appで必ずしも同じとは限らないので、共通化は慎重であるべきです。

`<>` で括った名前はプレースホルダであり、実際には任意の名前が含まれます。

```
├── docs : ドキュメント置き場
└── packages
    └── api : Lambdaで動作するAPI関連のコード。
    ├── app : Nuxt.jsを利用したフロントエンド/サーバーサイドのコード
    ├── core : api/app両方のアプリで共通するコードの置き場所
    │   └── features
    │       └── <feature> : api/appに共通する定数やロジックの置き場所
    └── lambda-layers : lambdaレイヤー用のコード置き場
```
