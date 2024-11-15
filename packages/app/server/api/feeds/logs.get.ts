import { FeedLog } from "~/features/feed/domain/feed-log"

export default defineEventHandler(async () => {
  return {
    feedLogs: [
      {
        id: "1123456789",
        title: "v0.1.0",
        url: "https://github.com/",
        date: new Date(),
        summary:
          "GitHub Copilot is an AI pair programmer that helps you write code faster.",
        createdAt: new Date(),
        updatedAt: new Date(),
        feed: {
          id: "1234567890",
          name: "github/copilot",
          cycle: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          dataSource: {
            id: "2345678901",
            name: "GitHub",
            url: "https://github.com",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    ] satisfies FeedLog[],
  }
})
