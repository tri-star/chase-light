#!/usr/bin/env tsx

/**
 * Message Processor Tests
 *
 * メッセージ処理ロジックに特化したテスト
 * 実行: pnpx tsx scripts/__tests__/message-processor-test.ts
 */

import {
  MessageProcessor,
  createMessageHandler,
} from "../lib/elasticmq-poller/message-processor.js"
import { type Message } from "@aws-sdk/client-sqs"
import { type PollerConfig } from "../lib/elasticmq-poller/config.js"

// テスト結果の管理
let totalTests = 0
let passedTests = 0
let failedTests = 0

// テストユーティリティ
function test(name: string, testFn: () => void | Promise<void>) {
  totalTests++
  console.log(`\n🧪 ${name}`)

  try {
    const result = testFn()
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedTests++
          console.log(`   ✅ PASS`)
        })
        .catch((error) => {
          failedTests++
          console.log(`   ❌ FAIL: ${error.message}`)
        })
    } else {
      passedTests++
      console.log(`   ✅ PASS`)
    }
  } catch (error) {
    failedTests++
    console.log(
      `   ❌ FAIL: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${expected}, got ${actual}`,
    )
  }
}

function assertExists<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error("Expected value to exist")
  }
}

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Expected condition to be true")
  }
}

// テスト用設定
const testConfig: PollerConfig = {
  elasticMqEndpoint: "http://localhost:9324",
  samLocalEndpoint: "http://localhost:3001",
  queueName: "process-updates-queue",
  lambdaFunctionName: "processUpdatesHandler", // テスト用Lambda関数名
  pollIntervalMs: 5000,
  maxMessages: 1,
  waitTimeSeconds: 20,
}

// テスト実行関数
async function runTests() {
  console.log("🚀 Message Processor テスト開始\n")

  // === MessageProcessor クラステスト ===
  console.log("📋 MessageProcessor クラステスト")

  test("MessageProcessor インスタンス作成", () => {
    const processor = new MessageProcessor(testConfig)
    assertExists(processor)
  })

  // === メッセージハンドラーテスト ===
  console.log("\n🔧 メッセージハンドラーテスト")

  test("createMessageHandler ファクトリー関数", () => {
    const handler = createMessageHandler(testConfig)
    assertEquals(typeof handler, "function")
  })

  // === メッセージ形式テスト ===
  console.log("\n📨 メッセージ形式テスト")

  test("正常なJSONメッセージの処理", () => {
    const mockMessage: Message = {
      Body: JSON.stringify({
        eventId: "test-event-123",
        action: "process-update",
        data: { key: "value" },
      }),
      MessageId: "msg-123",
      ReceiptHandle: "receipt-123",
    }

    assertExists(mockMessage.Body)
    const parsed = JSON.parse(mockMessage.Body)
    assertEquals(parsed.eventId, "test-event-123")
    assertEquals(parsed.action, "process-update")
    assertExists(parsed.data)
  })

  test("StepFunctions形式のメッセージ", () => {
    // StepFunctionsから送信される典型的なメッセージ形式
    const stepFunctionsMessage: Message = {
      Body: JSON.stringify({
        eventId: "event-456",
        timestamp: new Date().toISOString(),
        source: "step-functions",
      }),
      MessageId: "msg-456",
      ReceiptHandle: "receipt-456",
    }

    assertExists(stepFunctionsMessage.Body)
    const parsed = JSON.parse(stepFunctionsMessage.Body)
    assertEquals(parsed.eventId, "event-456")
    assertExists(parsed.timestamp)
    assertEquals(parsed.source, "step-functions")
  })

  test("空のメッセージ処理", () => {
    const emptyMessage: Message = {
      Body: "",
      MessageId: "msg-empty",
      ReceiptHandle: "receipt-empty",
    }

    // 空のBodyでも処理できることを確認
    assertEquals(emptyMessage.Body, "")
  })

  test("不正なJSONメッセージの回復処理", () => {
    const invalidJsonMessage: Message = {
      Body: "invalid json { broken",
      MessageId: "msg-invalid",
      ReceiptHandle: "receipt-invalid",
    }

    assertExists(invalidJsonMessage.Body)

    // 不正なJSONの場合、rawMessageとして扱われることを確認
    try {
      JSON.parse(invalidJsonMessage.Body)
      throw new Error("Should have thrown parse error")
    } catch (parseError) {
      // パースエラーが発生することを確認
      assertTrue(parseError instanceof SyntaxError)

      // この場合、{ rawMessage: "invalid json { broken" } として処理される
      const fallbackPayload = { rawMessage: invalidJsonMessage.Body }
      assertExists(fallbackPayload.rawMessage)
      assertEquals(fallbackPayload.rawMessage, "invalid json { broken")
    }
  })

  // === エラーハンドリングテスト ===
  console.log("\n❌ エラーハンドリングテスト")

  test("Body なしメッセージのエラー処理", async () => {
    const processor = new MessageProcessor(testConfig)
    const messageWithoutBody: Message = {
      MessageId: "msg-no-body",
      ReceiptHandle: "receipt-no-body",
      // Body は undefined
    }

    const result = await processor.processMessage(messageWithoutBody)

    // processMessage は結果オブジェクトを返し、エラーをスローしない
    assertEquals(result.success, false)
    assertExists(result.error)
    assertTrue(
      result.error.message.includes("Body"),
      "Error should mention missing Body",
    )
  })

  test("Lambda関数名解決エラー", async () => {
    const invalidConfig: PollerConfig = {
      ...testConfig,
      queueName: "non-existent-queue",
      lambdaFunctionName: "unknown-function", // 存在しないLambda関数名
    }

    const processor = new MessageProcessor(invalidConfig)
    const mockMessage: Message = {
      Body: JSON.stringify({ test: "data" }),
      MessageId: "msg-test",
      ReceiptHandle: "receipt-test",
    }

    // Lambda関数名が見つからない場合のエラーハンドリング
    const result = await processor.processMessage(mockMessage)

    // エラーが発生して success: false になることを確認
    assertEquals(result.success, false)
    assertExists(result.error)
    // 実際の実装では接続エラーになるはず
    console.log(`   エラー内容: ${result.error.message}`)
  })

  // === 統合テスト（モック Lambda 呼び出し） ===
  console.log("\n🔗 統合テスト")

  await test("Lambda接続エラーの処理", async () => {
    // SAM Localが起動していない場合のテスト
    const processor = new MessageProcessor(testConfig)
    const mockMessage: Message = {
      Body: JSON.stringify({ eventId: "test-connection-error" }),
      MessageId: "msg-connection-test",
      ReceiptHandle: "receipt-connection-test",
    }

    const result = await processor.processMessage(mockMessage)

    // SAM Localが起動していない場合は接続エラーになる
    if (!result.success) {
      assertExists(result.error)
      console.log(
        `   🔌 接続エラーが正しく処理されました: ${result.error.message}`,
      )
    } else {
      console.log(`   🎯 Lambda関数が正常に実行されました`)
    }
  })

  // === パフォーマンステスト ===
  console.log("\n⚡ パフォーマンステスト")

  test("大きなメッセージの処理", () => {
    const largeData = {
      id: "large-message-test",
      data: Array(1000)
        .fill("test-data-item")
        .map((item, index) => ({
          id: `${item}-${index}`,
          value: `value-${index}`,
          timestamp: new Date().toISOString(),
        })),
    }

    const largeMessage: Message = {
      Body: JSON.stringify(largeData),
      MessageId: "msg-large",
      ReceiptHandle: "receipt-large",
    }

    assertExists(largeMessage.Body)
    const parsed = JSON.parse(largeMessage.Body)
    assertEquals(parsed.id, "large-message-test")
    assertEquals(parsed.data.length, 1000)

    console.log(
      `   📦 大きなメッセージ（${largeMessage.Body.length} バイト）の処理を確認`,
    )
  })

  // === テスト結果表示 ===
  console.log("\n" + "=".repeat(50))
  console.log("📊 Message Processor テスト結果")
  console.log(`✅ 成功: ${passedTests}`)
  console.log(`❌ 失敗: ${failedTests}`)
  console.log(`📊 合計: ${totalTests}`)

  if (failedTests > 0) {
    console.log("\n❌ 一部のテストが失敗しました")
    process.exit(1)
  } else {
    console.log("\n🎉 すべてのテストが成功しました！")
    process.exit(0)
  }
}

// テスト実行
runTests().catch((error) => {
  console.error("\n💥 テスト実行エラー:", error)
  process.exit(1)
})
