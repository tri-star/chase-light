import { PrismaClient } from '@prisma/client';

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const hello = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    // イベントのログ出力
    console.log("Received event:", JSON.stringify(event, null, 2));

    const prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        }
      ]
    });

    prisma.$on('query', (e) => {
      console.log(e)
    })

    // Userモデルのレコードを取得
    const users = await prisma.user.findMany({
      relationLoadStrategy: 'join',
      include: {
        notifications: {
          take: 10,
        },
      }
    });

    // ここでビジネスロジックを実装
    const responseMessage = users;

    // 成功レスポンスの作成
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: responseMessage,
      }),
    };
  } catch (error) {
    console.error("Error processing event:", error);

    // エラーレスポンスの作成
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};