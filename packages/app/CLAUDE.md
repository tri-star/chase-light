# 開発タスクを進める際の注意事項

- 実装を進める上で設計を行った場合、実際に進める前にどんな設計で進めようとしているか、ユーザーに確認を求めてください
- 実装中、テスト中、コマンド実行中にエラーが起き、2回試行しても解消しない場合、その時点でユーザーに確認を求めてください

# 開発タスクの進め方

## 基本方針

基本的には以下のような流れで進めてください。
ただしこの手順は、タスクによっては違う手順で進める必要がある時もあります。
指示があった場合はその指示に従ってください。

- 作業用ブランチの作成
  - mainブランチで作業を開始した場合は新しく作業用ブランチを作成
  - feature/xxxx の形式
  - 課題番号が与えられている場合、feature/<課題番号>-xxx。 例： feature/URB-123-add-some-feature
- 新しい画面を追加、既存の画面を更新する場合、以下のフォルダを参考にコンポーネントやURL構造を検討してください。
  - packages/app/src/pages
  - packages/app/src/components/pages
  - packages/app/src/components/common
  - packages/app/src/features/feed/domain
- 作業に入る前に、どんなファイルを作り進めていくかを /development/tasks/<課題番号>/work.mdに記述し、ユーザーに確認を求めてください。
  必要に応じMermaidによる図解や、別ファイルにdrawioを作成して図解してください。
  - 作成中に方針が変わる都度、このファイルも更新してください。
- 以下のフォルダはdeprecatedで、この下に新しい要素は増やさないでください。
  (このフォルダ下のファイルの改修が必要で改修するのはOKです)
  - packages/app/src/features/feed/pages
- API呼び出しが必要で対応するAPIが不明な場合、ユーザーに問い合わせてください。
  「固定値で対応」と指示があった場合は、API呼び出し部分を固定値で実装しておき、後で置き換えるようにしてください。
- packages/appフォルダでは今の所UIに関するテストは存在しません。
  UIを変更したことに対するユニットテストは不要です。
  動作確認はユーザーが行うので、UI変更を確認できるタイミングでユーザーに確認を求めてください。
- packages/app/src/components/commonにコンポーネントを追加した場合、なるべくStorybook用のストーリーも一緒に作成してください。
- APIの追加が必要な場合、 packages/app/src/server/api 配下に定義をお願いします。
  - このフォルダの下のAPIでデータ取得を行う場合、実際にはpackages/api配下にも実装の追加が必要なことが多いです。
    packages/api配下に実装を追加しようとする場合、作業を進める前にユーザーに相談するようにしてください。
  - ユーザーが「ダミーの値で実装して欲しい」と要望したら、 packages/app/src/server/api 配下にダミーの値(固定値など)を返す実装をしてください
- packages/app/src/server/api 配下にテストを追加したら、対応するコンポーネント/コンポーザブル内にある固定値を返している部分をAPI呼び出しコードで置き換えてください。

### プラクティス

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- 複雑さに応じてアプローチを調整
- マジックナンバーを避け、定数を定義する
  - そのファイル・フォルダ固有で閉じて参照されるものであれば、ファイル内・フォルダ内のconstants.tsなどに宣言
  - より広い範囲で参照されるケースではpackages/app/src/features/<feature>/domain 配下が想定されます

## 開発中に実行するコマンド

- **テストの実行**: `pnpm test`
- **単一ファイルのテストの実行**: `pnpm test path/to/test.ts` or `pnpm test -t "test description"`
- **Linting**: `pnpm lint` (runs eslint, type checking, and biome)
- **Formatting**: `pnpm format` (API) or `pnpm format:biome && pnpm format:prettier` (App)

## フォルダ構成

```
/
├── docs : ドキュメント置き場
└── src
    ├── assets : バンドル対象となる画像/CSS置き場
    ├── components : Vueコンポーネントを配置。画面レベルのコンポーネントもここにフォルダを作成して配置
    │   ├── common : 複数画面で共有するコンポーネントを配置するフォルダ
    │   │   └── GlobalHeader.vue : アプリ全体で利用しうるコンポーネントはcommon配下に直接配置
    │   ├── <feature> : ある機能の中で共通して使われるコンポーネントを配置するフォルダ。例：FeedLogCard.vue
    │   └── <page> : ある画面に関するページレベル、ページ内の要素レベルのコンポーネントを配置。例： DashboardPage.vue, FeedListTable.vue
    ├── composables : アプリケーション内で共通して利用されるcomposableの置き場
    ├── exceptions : アプリケーション内で共通して利用されるErrorクラスの置き場
    ├── features : ドメインオブジェクト、ロジック、型定義、定数宣言ファイルの置き場
    │   └── <feature>
    │       ├── composables
    │       ├── domain
    │       └── pages : deprecated。このフォルダにあるコードは徐々に app/src/components/<page> に移動していきたいです。
    ├── layouts : Nuxt.jsのレイアウトコンポーネント
    ├── lib : 外部ライブラリに関するユーティリティ関数の定義
    ├── middleware : Nuxt.jsのミドルウェア
    ├── pages : Nuxt.jsのページコンポーネント置き場
    ├── plugins : Nuxt.jsのプラグイン
    ├── public : 静的ファイル置き場
    ├── server : Nuxt.jsのサーバーサイドコード置き場
    │   └── api : API関連のコード。この下で定義するAPIは/packages/apiをプロキシして内部でappプロジェクト内のオブジェクトに変換して返す実装となっていることを想定しています。
    ├── stories : Storybookのストーリー置き場
    └── types : TypeScriptのアンビエント型宣言ファイルを配置
```
