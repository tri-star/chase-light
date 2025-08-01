#!/usr/bin/env tsx

/**
 * ElasticMQ Poller - ローカル開発環境用SQSキュー監視ツール
 * 
 * ElasticMQのキューを監視し、メッセージを受信したときにSAM LocalのLambda関数を実行します。
 * 
 * 使用方法:
 *   pnpm poller --queue process-updates-queue
 *   pnpx tsx elasticmq-poller.ts --queue process-updates-queue --interval 3000
 */

import { logger } from './lib/elasticmq-poller/logger.js'
import { parseCommandLineArgs, createPollerConfig, showHelp } from './lib/elasticmq-poller/config.js'
import { createMessageHandler } from './lib/elasticmq-poller/message-processor.js'
import { ElasticMQPoller } from './lib/elasticmq-poller/poller.js'

async function main() {
  try {
    // コマンドライン引数を解析
    const args = parseCommandLineArgs(process.argv.slice(2))
    
    // ヘルプ表示
    if (args.help) {
      showHelp()
      process.exit(0)
    }
    
    // 設定を作成
    const config = createPollerConfig(args)
    
    // ポーラーとメッセージハンドラーを作成
    const poller = new ElasticMQPoller(config)
    const messageHandler = createMessageHandler(config)
    
    // シグナルハンドリング（Ctrl+C での停止）
    let isShuttingDown = false
    const handleShutdown = () => {
      if (isShuttingDown) {
        logger.warn('強制終了中...')
        process.exit(1)
      }
      
      isShuttingDown = true
      logger.info('停止信号を受信しました。ポーラーを停止中...')
      
      poller.stop()
      
      // 少し待ってから終了
      setTimeout(() => {
        process.exit(0)
      }, 1000)
    }
    
    process.on('SIGINT', handleShutdown)
    process.on('SIGTERM', handleShutdown)
    
    // ポーリング開始
    await poller.start(messageHandler)
    
  } catch (error) {
    logger.error('ポーラー起動エラー', error)
    
    if (error instanceof Error) {
      // よくあるエラーに対するヒント
      if (error.message.includes('設定ファイルが見つかりません')) {
        logger.info('ヒント: packages/backend ディレクトリから実行してください')
      } else if (error.message.includes('--queue オプション')) {
        logger.info('ヒント: --help オプションで使用方法を確認できます')
      } else if (error.message.includes('ECONNREFUSED')) {
        logger.info('ヒント: ElasticMQまたはSAM Localが起動していない可能性があります')
        logger.info('       pnpm local:start で開発環境を起動してください')
      }
    }
    
    process.exit(1)
  }
}

// メイン処理を実行
main().catch((error) => {
  logger.error('予期しないエラー', error)
  process.exit(1)
})