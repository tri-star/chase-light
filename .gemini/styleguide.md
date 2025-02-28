# スタイルガイド

## レビューにおける基本方針

- レビューコメントは日本語でお願いします。

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
    ├── api : Lambdaで動作するAPI関連のコード
    │   ├── docs : ドキュメント置き場
    │   ├── prisma : Prismaのスキーマ定義、マイグレーション定義
    │   ├── scripts : 開発時に利用するスクリプト置き場
    │   ├── src
    │   │   ├── __generated__ : Prismaが自動生成するファイルを置く場所
    │   │   │   └── fabbrica
    │   │   ├── errors : 例外クラス
    │   │   ├── features : アプリケーションの機能毎にディレクトリを作成
    │   │   │   └── <feature> :
    │   │   │       ├── domain : ドメインロジック、zodスキーマ定義、型定義、定数宣言などを配置
    │   │   │       │   └── __tests__ : テストコード。実装ファイルと同じ階層に__tests__フォルダを作成してテストコードを配置
    │   │   │       ├── repositories : Prismaを利用したデータ操作処理をRepositoryクラスとして配置
    │   │   │       ├── services : 外部APIの呼び出しを伴う処理や複数のオブジェクトを組み合わせた処理にアプリケーション上の言葉を使った名前を付けて定義
    │   │   │       └── usecases : Controller層に記述するには長いロジックに名前を付けたものを配置
    │   │   ├── handlers: API Gateway, StepFunctionsで動作するLambdaのハンドラ関数を配置。このフォルダの下にあるコードはController的なものであり、長いロジックは避けるべきです。
    │   │   │   ├── api-gateway : API Gatewayにデプロイするコードの置き場
    │   │   │   │   ├── app
    │   │   │   │   │   └── middlewares
    │   │   │   │   └── <feature_name> : フィーチャー毎にディレクトリを作成(Lambda関数1つに対応)
    │   │   │   │       └── actions : Lambda関数内の各種ロジックを配置
    │   │   │   └── step-functions : StepFunctionsにデプロイするコードの置き場
    │   │   ├── lib : 外部ライブラリに関するユーティリティ関数の定義
    │   │   └── types : TypeScriptのアンビエント型宣言ファイルを配置
    │   └── supabase
    ├── app : Nuxt.jsを利用したフロントエンド/サーバーサイドのコード
    │   ├── docs : ドキュメント置き場
    │   └── src
    │       ├── assets : バンドル対象となる画像/CSS置き場
    │       ├── components : Vueコンポーネントを配置。画面レベルのコンポーネントもここにフォルダを作成して配置
    │       │   ├── common : 複数画面で共有するコンポーネントを配置するフォルダ
    │       │   │   ├── GlobalHeader.vue : アプリ全体で利用しうるコンポーネントはcommon配下に直接配置
    │       │   │   └── <feature> : ある機能の中で共通して使われるコンポーネントを配置するフォルダ。例：FeedLogCard.vue
    │       │   └── <page> : ある画面に関するページレベル、ページ内の要素レベルのコンポーネントを配置。例： DashboardPage.vue, FeedListTable.vue
    │       ├── composables : アプリケーション内で共通して利用されるcomposableの置き場
    │       ├── exceptions : アプリケーション内で共通して利用されるErrorクラスの置き場
    │       ├── features : ドメインオブジェクト、ロジック、型定義、定数宣言ファイルの置き場
    │       │   └── <feature>
    │       │       ├── composables
    │       │       ├── domain
    │       │       └── pages : deprecated。このフォルダにあるコードは徐々に app/src/components/<page> に移動していきたいです。
    │       ├── layouts : Nuxt.jsのレイアウトコンポーネント
    │       ├── lib : 外部ライブラリに関するユーティリティ関数の定義
    │       ├── middleware : Nuxt.jsのミドルウェア
    │       ├── pages : Nuxt.jsのページコンポーネント置き場
    │       ├── plugins : Nuxt.jsのプラグイン
    │       ├── public : 静的ファイル置き場
    │       ├── server : Nuxt.jsのサーバーサイドコード置き場
    │       │   └── api : API関連のコード。この下で定義するAPIは/packages/apiをプロキシして内部でappプロジェクト内のオブジェクトに変換して返す実装となっていることを想定しています。
    │       ├── stories : Storybookのストーリー置き場
    │       └── types : TypeScriptのアンビエント型宣言ファイルを配置
    ├── core : api/app両方のアプリで共通するコードの置き場所
    │   └── features
    │       └── <feature> : api/appに共通する定数やロジックの置き場所
    └── lambda-layers : lambdaレイヤー用のコード置き場
```

## packages/api 配下の規則

### Repositoryクラス

- 基本的には以下のような実装を目指します。
  - ドメインオブジェクトを受けとり、外部ストレージに保存する
  - 指定されたIDや検索条件を元に外部ストレージを検索し、ドメインオブジェクトを返す
  - 内部でPrismaを利用するが、Prismaのモデルを返却することは基本的には避ける。
    - パフォーマンスの理由でこれを守れない場合は、その旨をコメントで触れる

### 外部API呼び出しを伴うロジック

- 外部API呼び出しを伴うロジックはServiceクラスとして実装し、何らかの方法でテスト時やローカル環境では
  差し替えが出来る状態となっていることを求めます。

### Controllerロジック

- packages/api/src/handlers配下にあるコードはController的なものとして考えます。
- Hono+OpenAPIでLambdaのハンドラを記述することから、API定義部分が長くなることがありますが、
  アプリケーションのロジック(DB問い合わせやJSON整形)が100行など長くなることは避けるべきです。
  アプリケーションコードが長くなる場合、packages/api/src/<feature>/usecases配下にロジックを移動することを提案してください。

### /packages/app配下

- app配下ではapiとは異なりRepository, Serviceクラスを設けることを今の所考えていません。

- 以下のフォルダ配下のコードでは、各ファイルに対応するテストコードが存在する必要があります。
  - /packages/app/src/handlers/api-gateway/<feature_name>/actions
  - /packages/app/src/features/step-functions/<feature_name>
