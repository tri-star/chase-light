import type {
  AnalyzeResultItem,
  GitHubReleaseAnalyzerInterface,
} from '@/features/feed/services/github-release-analyzer'

export class GitHubReleaseAnalyzerOpenAI
  implements GitHubReleaseAnalyzerInterface
{
  async analyze(_releaseBody: string): Promise<AnalyzeResultItem[]> {
    return [
      {
        summary: '@tailwindcss/viteから不適切なconsole.logを削除',
        link: {
          title: '#16307',
          url: 'https://github.com/tailwindlabs/tailwindcss/pull/16307',
        },
      },
      {
        summary:
          '使用されていないテーマ変数をコンパイルされたCSSに含めないようにする',
        link: {
          title: '#16211',
          url: 'https://github.com/tailwindlabs/tailwindcss/pull/16211',
        },
      },
    ]
  }
}
