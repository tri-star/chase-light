# CHASE-38 技術設計検討結果

## 検討概要

CHASE-38「GitHub リポジトリの定期監視機能実装」の技術的課題について調査・検討を実施しました。

## 検討課題と結果

### 1. AWSデプロイ方法の検討

#### 課題

StepFunctions + Lambdaリソースのデプロイ方法の決定

#### 調査結果

**AWS SAMによるStepFunctions統一管理が可能**

- AWS SAMは2020年5月よりStepFunctionsをサポート
- `AWS::Serverless::StateMachine`リソースタイプが利用可能
- DefinitionUriでのASL（Amazon States Language）定義ファイル参照をサポート
- SAM Policy Templatesでのアクセス許可設定が可能
- CloudFormationとの完全互換性を保持

#### 推奨アプローチ

```yaml
# SAMテンプレート例
Resources:
  MonitoringStateMachine:
    Type: AWS::Serverless::StateMachine
    Properties:
      DefinitionUri: statemachine/repository-monitoring.asl.json
      DefinitionSubstitutions:
        ListDatasourcesFunction: !Ref ListDatasourcesFunction
        DetectDatasourceUpdatesFunction: !Ref DetectDatasourceUpdatesFunction
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: rate(1 day)
```

**メリット**:

- Lambda関数とStepFunctionsを統一されたテンプレートで管理
- SAM CLIによる統一されたデプロイワークフロー
- ローカル開発環境との一貫性

### 2. ローカル開発環境の構築方法

#### 課題

StepFunctions LocalとSAM Localを使ったローカル開発環境の構築

#### 調査結果

**Docker Composeベースの統合環境を推奨**

##### 必要コンポーネント

1. **AWS SAM CLI Local** - Lambda関数の実行環境
2. **StepFunctions Local** - ステートマシンの実行環境
3. **Docker** - コンテナ化されたサービス群

##### セットアップフロー

```bash
# 1. SAM Local起動（Lambda実行）
sam local start-lambda --port 3001

# 2. StepFunctions Local起動（Dockerコンテナ）
docker run -p 8083:8083 \
  -e LAMBDA_ENDPOINT=http://host.docker.internal:3001 \
  amazon/aws-stepfunctions-local

# 3. 統合テスト実行
aws stepfunctions start-execution \
  --endpoint-url http://localhost:8083 \
  --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:MonitoringWorkflow
```

**制約事項**:

- StepFunctions Localは実験的機能（Unsupported）
- 本番環境との完全なパリティは保証されない
- 外部サービス統合のモック設定が必要

### 3. ワーカー機能のフォルダ構成設計

#### 課題

StepFunctions用ワーカーLambdaの配置場所とアーキテクチャ設計

#### 設計方針

**新規featureとしてmonitoringフィーチャーを作成**

```
src/features/monitoring/
├── domain/
│   ├── monitoring-job.ts
│   ├── repository-check-result.ts
│   └── index.ts
├── workers/
│   ├── list-datasources/
│   │   ├── handler.ts
│   │   ├── __tests__/
│   │   │   └── handler.test.ts
│   │   └── index.ts
│   ├── detect-datasource-updates/
│   │   ├── handler.ts
│   │   ├── __tests__/
│   │   │   └── handler.test.ts
│   │   └── index.ts
│   └── process-updates/
│       ├── handler.ts
│       ├── __tests__/
│       │   └── handler.test.ts
│       └── index.ts
├── services/
│   ├── monitoring-orchestrator.service.ts
│   ├── repository-monitor.service.ts
│   └── index.ts
├── repositories/
│   ├── monitoring-job.repository.ts
│   └── index.ts
├── step-functions/
│   ├── repository-monitoring.asl.json
│   └── sam-template.yaml <!-- REVIEW: API GatewayのLambdaもSAMでデプロイする予定です。そうすると、このファイルはpackages/backend配下などに合った方が良いでしょうか？または、このファイルはStepFunctionsの定義だけを含んだファイルですか？ -->
└── index.ts
```

#### 設計の特徴

- **workers/**配下にStepFunctions用Lambda関数を配置
- 既存のPresentation層（API Gateway用）と区別
- ドメインロジックは共通のservicesとrepositories層で共有
- StepFunctions定義ファイルも同じフィーチャー内で管理

### 4. 既存data-sourcesフィーチャーとの連携方法

#### 課題

既存のdata-sourcesフィーチャーとの効率的な連携設計

#### 連携戦略

**Cross-Feature Dependency Injection**

##### 4.1 リポジトリ層の再利用

```typescript
// monitoring/services/repository-monitor.service.ts
import { DataSourceRepository } from "../../data-sources/repositories";
import { GitHubApiService } from "../../data-sources/services";

export class RepositoryMonitorService {
  constructor(
    private dataSourceRepo: DataSourceRepository,
    private githubApi: GitHubApiService
  ) {}

  async getMonitoringTargets(): Promise<DataSource[]> {
    return this.dataSourceRepo.findMany({
      sourceType: DATA_SOURCE_TYPES.GITHUB,
    });
  }
}
```

##### 4.2 共有サービスの活用

- GitHubApiServiceの再利用
- DataSourceRepositoryの監視対象取得メソッド活用
- トランザクション管理の統一

##### 4.3 イベント管理の拡張

- 既存のevents、notificationsテーブルを活用
- 新規イベントタイプの追加（repository.release.created等）

### 5. StepFunctionsフロー全体のテスト戦略

#### 課題

StepFunctionsを含む監視フロー全体のテスト手法の設計

#### 多層テスト戦略

**Component Test重視 + StepFunctions Local補完**

##### 5.1 テスト層の分類

1. **Unit Test** - 個別Worker関数のロジックテスト
2. **Component Test** - 実DB接続での統合テスト
3. **StepFunctions Local Test** - ワークフロー全体のテスト
4. **End-to-End Test** - 本番環境デプロイ後の動作確認

##### 5.2 Component Test重視の理由

- プロジェクト方針に沿った実DB接続テスト
- より実践的な品質保証
- StepFunctions Localの制約を補完

##### 5.3 テストファイル配置

```
workers/
├── list-datasources/
│   ├── handler.ts
│   ├── __tests__/
│   │   └── handler.component.test.ts  # Component Test
│   └── index.ts
├── detect-datasource-updates/
│   ├── handler.ts
│   ├── __tests__/
│   │   └── handler.component.test.ts  # Component Test
│   └── index.ts
├── process-updates/
│   ├── handler.ts
│   ├── __tests__/
│   │   └── handler.component.test.ts  # Component Test
│   └── index.ts
└── __tests__/
    └── workflow.integration.test.ts # StepFunctions統合テスト
```

##### 5.4 モック戦略

- **GitHub API**: スタブ化（既存のGitHubApiServiceStub活用）
- **Database**: 実DB接続（テスト用DB）
- **StepFunctions**: Local環境でのモック設定

## 実装における注意点

### AWS SDKの導入

```bash
pnpm add --filter backend @aws-sdk/client-sqs @aws-sdk/client-lambda @aws-sdk/client-step-functions
```

### 環境変数の整理

- Step Functions ARN
- SQS Queue URL
- GitHub API設定
- モニタリング間隔設定

### エラーハンドリング

- リトライロジックの実装
- デッドレターキューの設定
- アラート機能の実装

### セキュリティ考慮事項

- IAMロールの最小権限設定
- GitHubアクセストークンの安全な管理
- VPCエンドポイントの活用検討

## 次のアクションアイテム

1. **SAMテンプレートの作成**: StepFunctions + Lambda統合定義
2. **ワーカー関数の基本実装**: 3つのLambda関数のスケルトン作成
   - list-datasources: 監視対象データソース一覧取得
   - detect-datasource-updates: データソース更新検知
   - process-updates: 更新処理
3. **ローカル開発環境の構築**: Docker Compose設定
4. **Component Testの実装**: テスト戦略に従ったテストコード作成
5. **既存serviceとの統合**: GitHubApiServiceとDataSourceRepositoryの活用

## 総評

AWS SAMによるStepFunctions統一管理により、技術的な課題は解決可能です。既存のアーキテクチャとの整合性を保ちながら、拡張性の高い監視システムを構築できる設計となっています。

特に、Component Test重視のテスト戦略により、プロジェクトの品質基準を満たしつつ、StepFunctionsの複雑性に対応できる体制を整えることができます。
