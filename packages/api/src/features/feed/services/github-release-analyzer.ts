import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

export type AnalyzeResultItem = {
  summary: string
  link?: {
    title: string
    url: string
  }
}

export const analyzeResultResponseSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      link: z
        .object({
          title: z.string(),
          url: z.string(),
        })
        .optional(),
    }),
  ),
})

export const analyzeBasePrompt = `
# 概要
あなたの仕事はGitHubのリリースノートを監視し、役に立つ情報を要約してユーザーに紹介することです。

以下は、あるGitHubリポジトリのリリースノートです。
この内容を以下のような規則で分類、要約してください。

# 規則

- 箇条書きのリストがあり、"[説明文][何らかのデリミタ][#PRの番号]"の構造になっている場合
  - 説明文(summary)、PR番号(pr)、PRのURL(url)を抜き出してください。
  - 説明文(summary)は日本語で要約してください。
- リスト以外の形式で説明が行われている場合
  - その内容を要約し、説明文(summary)として抜き出してください
  - 説明文(summary)は日本語で要約してください。
  - 説明文中にURLが含まれている場合、最初の1つをURL(url)として抜き出してください。
`

export interface GitHubReleaseAnalyzerInterface {
  analyze(releaseBody: string): Promise<AnalyzeResultItem[]>
}

let gitHubReleaseAnalyzer: GitHubReleaseAnalyzerInterface | undefined =
  undefined

export function getGitHubReleaseAnalyzer(): GitHubReleaseAnalyzerInterface {
  if (!gitHubReleaseAnalyzer) {
    gitHubReleaseAnalyzer = new GitHubReleaseAnalyzerOpenAI()
  }
  return gitHubReleaseAnalyzer
}

export function swapGitHubReleaseAnalyzerForTest(
  analyzer: GitHubReleaseAnalyzerInterface,
): void {
  gitHubReleaseAnalyzer = analyzer
}

/**
 * OpenAI APIを利用してGitHubのリリース本文を解析する
 */
export class GitHubReleaseAnalyzerOpenAI
  implements GitHubReleaseAnalyzerInterface
{
  private openAiClient: OpenAI

  constructor(openAiClient?: OpenAI) {
    if (openAiClient === undefined) {
      this.openAiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    } else {
      this.openAiClient = openAiClient
    }
  }

  async analyze(releaseBody: string): Promise<AnalyzeResultItem[]> {
    const completionResponse =
      await this.openAiClient.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: analyzeBasePrompt,
          },
          {
            role: 'user',
            content: releaseBody,
          },
        ],
        response_format: zodResponseFormat(
          analyzeResultResponseSchema,
          'result',
        ),
      })

    console.log('Open AI Response:', completionResponse)
    return []
  }
}
