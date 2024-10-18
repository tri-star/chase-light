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

    // ここでビジネスロジックを実装
    const responseMessage = "Hello, World!";

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
