# 開発タスクを進める際の注意事項

- 実装を進める上で設計を行った場合、実際に進める前にどんな設計で進めようとしているか、ユーザーに確認を求めてください
- 実装中、テスト中、コマンド実行中にエラーが起き、2回試行しても解消しない場合、その時点でユーザーに確認を求めてください

# 開発タスクの進め方

## 基本方針

基本的には以下のような流れで進めてください。

- 作業用ブランチの作成
  - mainブランチで作業を開始した場合は新しく作業用ブランチを作成
  - feature/xxxx の形式
  - 課題番号が与えられている場合、feature/<課題番号>-xxx。 例： feature/URB-123-add-some-feature
- テーブルの追加、変更が必要かを検討してください。必要な場合、以下のフォルダを見て改修してください。
  テーブルを追加・変更した場合は対応するFactoryの追加・変更もお願いします。
  - packages/api/prisma
- 新しいエンドポイントを追加する場合、既存コードを参考に新しいフォルダ、ファイルを作成してエンドポイントを追加。最初はロジックは空の状態で作成
  - API GatewayにAPIを追加する場合
    - packages/api/src/handlers/api-gateway
    - packages/api/src/handlers/api-gateway/app/route-consts.ts
    - packages/api/src/features
    - packages/core
  - Step Functions用関数を追加する場合
    - packages/api/src/handlers/step-functions
    - packages/api/src/features
    - packages/core
- 新しいエンドポイントを追加する場合、testsフォルダ配下に対応するテストコードを追加
  - この時点で考えられるAPIの期待する入力と出力を検討してテストを実装
  - テストが通るように実装を直しながら進めます
  - この時点では、packages/api/src/handlers/api-gatewayフォルダ配下のハンドラー関数にロジックを直接実装します
- テストが通るようになった段階で、ハンドラー関数内に外部サービス(Prismaを除く)の呼び出しがある場合、
  packages/api/src/features/<feature>/services 配下にサービスクラスとインターフェースを作成し、それを呼び出すように抽出してください。
  - この時、サービスクラスはテスト時にスタブ実装に差し替えられるようにしてください
- ハンドラー関数内でPrismaを呼び出すロジックについては、共通化が必要と思われる場合はpackages/api/src/features/<feature>/repositories 配下のリポジトリに処理を抽出してください。
  - 十分にシンプルなAPIの場合、この手順は不要です
  - どのRepositoryに追加するかは集約を意識して検討してください
- ここまで進めてpackages/api/src/handlers/api-gateway配下のハンドラー関数のロジック部分が長いと思われる場合、
  packages/api/src/features/<feature>/usecases配下にクラスを作成、ロジックを抜き出してください

### プラクティス

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- 複雑さに応じてアプローチを調整
- マジックナンバーを避け、定数を定義する
  - そのファイル・フォルダ固有で閉じて参照されるものであれば、ファイル内・フォルダ内のconstants.tsなどに宣言
  - より広い範囲で参照されるケースではpackages/api/src/features/<feature>/domain 配下が想定されます

### テスト戦略

- 純粋関数の単体テストを優先
- DBを参照するテストはそのままDBを利用する
  (アプリケーション全体で、テスト時はテスト用DBを作成、毎回全テーブルtruncateする方針としています)
- テスト可能性を設計に組み込む
  - 外部サービスを利用するものはモック/スタブで差し替える。これが出来る実装を目指します
- アサートファースト：期待結果から逆算

## 詳細な方針

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

## 開発中に実行するコマンド

- **マイグレーションファイル追加+実行**: `npx prisma migrate dev --name <マイグレーション名>`
- **マイグレーションファイル追加のみ**: `npx prisma migrate dev --name <マイグレーション名> --create-only`
- **その他のPrisma関連のコマンド実行**: `npx prisma <任意のオプション>`
- **テストの実行**: `pnpm test`
- **単一ファイルのテストの実行**: `pnpm test path/to/test.ts` or `pnpm test -t "test description"`
- **Linting**: `pnpm lint` (runs eslint, type checking, and biome)
- **Formatting**: `pnpm format` (API) or `pnpm format:biome && pnpm format:prettier` (App)

## フォルダ構造

```
/
├── docs : ドキュメント置き場
├── prisma : Prismaのスキーマ定義、マイグレーション定義
├── scripts : 開発時に利用するスクリプト置き場
├── src
│   ├── generated : Prismaが自動生成するファイルを置く場所
│   │   └── fabbrica
│   ├── errors : 例外クラス
│   ├── features : アプリケーションの機能毎にディレクトリを作成
│   │   └── <feature> :
│   │       ├── domain : ドメインロジック、zodスキーマ定義、型定義、定数宣言などを配置
│   │       │   └── tests : テストコード。実装ファイルと同じ階層にtestsフォルダを作成してテストコードを配置
│   │       ├── repositories : Prismaを利用したデータ操作処理をRepositoryクラスとして配置
│   │       ├── services : 外部APIの呼び出しを伴う処理や複数のオブジェクトを組み合わせた処理にアプリケーション上の言葉を使った名前を付けて定義
│   │       └── usecases : Controller層に記述するには長いロジックに名前を付けたものを配置
│   ├── handlers: API Gateway, StepFunctionsで動作するLambdaのハンドラ関数を配置。このフォルダの下にあるコードはController的なものであり、長いロジックは避けるべきです。
│   │   ├── api-gateway : API Gatewayにデプロイするコードの置き場
│   │   │   ├── app
│   │   │   │   └── middlewares
│   │   │   └── <feature_name> : フィーチャー毎にディレクトリを作成(Lambda関数1つに対応)
│   │   │       └── actions : Lambda関数内の各種ロジックを配置
│   │   └── step-functions : StepFunctionsにデプロイするコードの置き場
│   ├── lib : 外部ライブラリに関するユーティリティ関数の定義
│   └── types : TypeScriptのアンビエント型宣言ファイルを配置
└── supabase
```
