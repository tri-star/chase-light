// Lambda関数の設定定義
export const lambdaConfigs = {
  "list-datasources": {
    name: "list-datasources-lambda",
    description: "List data sources for monitoring",
    entryPoint: "./src/features/monitoring/workers/list-datasources/index.ts",
    // バンドルから除外するパッケージ（node_modulesにインストールされる）
    externalPackages: ["@aws-sdk/*", "aws-sdk", "pg", "drizzle-orm", "dotenv"],
    // Lambda関数のpackage.jsonに含める依存関係
    dependencies: {
      "@aws-sdk/client-ssm": "^3.848.0",
      pg: "^8.16.0",
      "drizzle-orm": "^0.44.2",
      dotenv: "^16.5.0",
    },
  },
  // 将来的に他のLambda関数もここに追加
  // 'another-function': { ... }
}

// デフォルトのesbuild設定
export const defaultEsbuildConfig = {
  platform: "node",
  target: "node20",
  format: "esm",
  bundle: true,
  sourcemap: "external",
  minify: false,
}

// デフォルトのpackage.json設定
export const defaultPackageJsonConfig = {
  version: "1.0.0",
  type: "module",
  engines: {
    node: ">=20.0.0",
  },
}
