# 作業の概要

アプリケーションのログをconsole.logやconsole.errorではなく、構造化されており
コンテキストを含んだものに変更したいです。

- Honoのミドルウェアなどを利用し、「どのエントリポイントか」などの情報をコンテキストとして残せるようにする
  - UseCaseクラスでもコンテキスト情報を加えられるように、アプリケーションの任意の場所で
- アプリケーション内の任意の場所からloggerなどの名前でimportして利用出来るようにする
- ログの出力先は常にconsole
- ログのフォーマットはJSON形式にする

# タスクリスト

今回はLoggerを用意するところまでを行います。
(各所に組み込むのは別のタスクです)

- [ ] packages/api以下のソースコードを確認し、どこにloggerのファイルを作成するか検討してください。
      ファイルを作成する前に、方針をユーザーに相談してください
- [ ] Honoのミドルウェアを定義して下さい。これも。ファイルを作成する前にユーザーに方針を相談してください
- [ ] UseCaseクラスなど、handler関数から呼び出される別の処理からLoggerのContextを拡張出来るようにしてください。 "UseCaseから利用する際のイメージ"セクションを参考にしてください。

# UseCaseから利用する際のイメージ

以下のようなイメージで使える状態を目指したいです。
おそらく、Loggerの方ではコンテキスト情報をスタック状に管理し、withContextの中でpush, popする必要があると思いますが、この部分の実装はおまかせします。

## Honoのミドルウェア

```typescript
import { logger } from '...'

export const loggerMiddleware: MiddlewareHandler<AppContext> = async (
  c,
  next,
) => {
  // logger.addContextで、以降の全てのログに付与するコンテキスト情報をセットできる
  logger.addContext({
    requestId: /* LambdaやAPI Gatewayのリクエストを識別するIDをHonoのコンテキストから取得してセット */,
  })
  await next()
}

```

## UseCaseクラス

```typescript
import { logger } from '...'

class FeedCreateUseCase {
  async execute(createFeedCommand: CreateFeedCommand): Promise<void> {
    // loggerにはあらかじめ、Honoのミドルウェアで初期状態のコンテキストがセットされている。

    // コールバック関数内の全てのログにコンテキスト情報を付与することも出来る
    // これにより、UseCase内の全てのログにuseCaseキーを渡すようなことが出来る
    const result = await logger.withContext(
      async () => {
        // このログには、withContextで指定したコンテキスト情報が付与される
        logger.info('some message')

        // その場限りの追加のコンテキスト情報も渡せる
        logger.info('some message with context', {
          feedId: createFeedCommand.feedId,
        })
      },
      {
        // 横断的なコンテキスト情報
        useCase: 'FeedCreateUseCase',
      }
    )

    // これ以降のコードには、上記のwithContextで指定したコンテキスト情報は反映されない
    return result
  }
}
```
