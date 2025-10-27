import { writeFile } from "node:fs/promises"
import { get } from "node:http"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, "..")

/**
 * HTTPリクエストを送信してJSONレスポンスを取得する
 */
function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = get(
      url,
      { headers: { Accept: "application/json" } },
      (response) => {
        let data = ""

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP error! status: ${response.statusCode}`))
          return
        }

        response.setEncoding("utf8")
        response.on("data", (chunk) => {
          data += chunk
        })

        response.on("end", () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error}`))
          }
        })
      },
    )

    request.on("error", (error) => {
      reject(error)
    })

    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error("Request timeout"))
    })
  })
}

/**
 * 指定されたポートのローカルサーバーからOpenAPI仕様を取得し、JSONファイルに保存する
 */
async function updateOpenApiJson(): Promise<void> {
  const PORT = process.env.PORT || "3001"
  const openApiUrl = `http://localhost:${PORT}/doc`
  const outputPath = resolve(__dirname, "../openapi.json")

  try {
    console.log(`Fetching OpenAPI specification from ${openApiUrl}...`)

    const openApiSpec = await fetchJson(openApiUrl)

    // JSONを整形して出力
    const formattedJson = JSON.stringify(openApiSpec, null, 2)

    await writeFile(outputPath, formattedJson, "utf-8")

    console.log(`✅ OpenAPI specification saved to ${outputPath}`)
  } catch (error) {
    console.error("❌ Failed to update OpenAPI JSON:", error)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateOpenApiJson()
}

export { updateOpenApiJson }
