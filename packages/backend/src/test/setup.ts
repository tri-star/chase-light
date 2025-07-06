import { config } from "dotenv"

// テスト環境の.env.testingファイルを読み込み
config({ path: ".env.testing" })

// テスト実行前に環境変数が正しく設定されているかを確認
console.log("🧪 Test environment initialized")
console.log("Database:", process.env.DB_NAME)
console.log("Node Environment:", process.env.NODE_ENV)
