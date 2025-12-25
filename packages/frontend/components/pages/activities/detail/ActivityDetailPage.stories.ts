import type { StoryObj, Meta } from '@nuxtjs/storybook'
import { http, HttpResponse } from 'msw'
import ActivityDetailPage from './ActivityDetailPage.vue'
import type { ActivityDetailResponse } from '~/generated/api/schemas'
import { expect, within, userEvent } from 'storybook/test'

const meta: Meta<typeof ActivityDetailPage> = {
  title: 'Components/Pages/ActivityDetailPage',
  component: ActivityDetailPage,
  parameters: {
    docs: {
      description: {
        component:
          'アクティビティ詳細ページのメインコンポーネントです。GitHub リポジトリのリリース、Issue、PR などの詳細情報を表示します。翻訳表示と原文表示の切り替えが可能です。',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    () => ({
      template: `
        <div>
          <Suspense>
            <template #default>
              <story />
            </template>
            <template #fallback>
              <div class="flex items-center justify-center min-h-screen">
                <div class="text-lg">読み込み中...</div>
              </div>
            </template>
          </Suspense>
        </div>
      `,
    }),
  ],
  args: {
    activityId: 'activity-1',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// モックデータ生成用のヘルパー
const createActivityDetailResponse = (
  override?: Partial<ActivityDetailResponse['data']['activity']>
): ActivityDetailResponse => {
  const now = new Date(2025, 11, 1, 12, 0, 0, 0)

  return {
    success: true,
    data: {
      activity: {
        id: 'activity-1',
        activityType: 'release',
        title: 'Release v1.0.0 - Initial Release',
        translatedTitle: 'リリース v1.0.0 - 初回リリース',
        summary: '新機能とバグ修正を含む初回リリースです',
        detail: `## What's Changed

### New Features
- Added authentication support
- Implemented dashboard page
- Created notification system

### Bug Fixes
- Fixed memory leak in background tasks
- Resolved timezone issues

### Breaking Changes
- API endpoints have been restructured

**Full Changelog**: https://github.com/example/repo/compare/v0.9.0...v1.0.0`,
        translatedBody: `## 変更内容

### 新機能
- 認証機能を追加
- ダッシュボードページを実装
- 通知システムを作成

### バグ修正
- バックグラウンドタスクのメモリリークを修正
- タイムゾーンの問題を解決

### 破壊的変更
- APIエンドポイントが再構成されました

**完全な変更履歴**: https://github.com/example/repo/compare/v0.9.0...v1.0.0`,
        bodyTranslationStatus: 'completed',
        status: 'completed',
        statusDetail: null,
        version: 'v1.0.0',
        occurredAt: new Date(now.getTime() - 86400000).toISOString(), // 1日前
        lastUpdatedAt: new Date(now.getTime() - 3600000).toISOString(), // 1時間前
        source: {
          id: 'ds-1',
          sourceType: 'github_repository',
          name: 'facebook/react',
          url: 'https://github.com/facebook/react',
          metadata: {
            repositoryFullName: 'facebook/react',
            repositoryLanguage: 'JavaScript',
            starsCount: 220000,
            forksCount: 45000,
            openIssuesCount: 1200,
          },
        },
        ...override,
      },
    },
  }
}

// MSWハンドラー
const activityDetailSuccessHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(createActivityDetailResponse())
  }
)

const activityDetailErrorHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return new HttpResponse(null, { status: 500 })
  }
)

const activityDetailNotFoundHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'アクティビティが見つかりません',
        },
      },
      { status: 404 }
    )
  }
)

const activityDetailLoadingHandler = http.get(
  '*/api/activities/:activityId',
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return HttpResponse.json(createActivityDetailResponse())
  }
)

// 翻訳なしのデータ
const activityDetailNoTranslationHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        translatedTitle: null,
        translatedBody: null,
      })
    )
  }
)

// Issue タイプのアクティビティ
const activityDetailIssueHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        id: 'activity-2',
        activityType: 'issue',
        title: 'Bug: Memory leak in useEffect cleanup',
        translatedTitle: 'バグ: useEffectクリーンアップでメモリリーク発生',
        detail: `## Description

There seems to be a memory leak when using useEffect with async operations.

## Steps to Reproduce
1. Create a component with useEffect
2. Fetch data inside useEffect
3. Unmount the component before fetch completes

## Expected Behavior
Memory should be cleaned up properly.

## Actual Behavior
Memory keeps growing over time.`,
        translatedBody: `## 説明

非同期処理を含むuseEffectを使用するとメモリリークが発生するようです。

## 再現手順
1. useEffectを含むコンポーネントを作成
2. useEffect内でデータをフェッチ
3. フェッチ完了前にコンポーネントをアンマウント

## 期待される動作
メモリが適切にクリーンアップされること

## 実際の動作
時間経過とともにメモリが増加し続ける`,
        version: null,
        summary: 'useEffectのクリーンアップに関するメモリリークの報告',
      })
    )
  }
)

// PR タイプのアクティビティ
const activityDetailPRHandler = http.get('*/api/activities/:activityId', () => {
  return HttpResponse.json(
    createActivityDetailResponse({
      id: 'activity-3',
      activityType: 'pull_request',
      title: 'feat: Add TypeScript strict mode support',
      translatedTitle: 'feat: TypeScript strictモードサポートを追加',
      detail: `## Summary

This PR enables TypeScript strict mode across the entire codebase.

## Changes
- Updated tsconfig.json with strict: true
- Fixed all type errors (152 files modified)
- Added proper type guards where needed

## Testing
- All existing tests pass
- Added new type-safety tests`,
      translatedBody: `## 概要

このPRはコードベース全体でTypeScriptのstrictモードを有効にします。

## 変更内容
- tsconfig.jsonをstrict: trueに更新
- すべての型エラーを修正（152ファイルを変更）
- 必要な箇所に適切な型ガードを追加

## テスト
- 既存のテストはすべてパス
- 新しい型安全性テストを追加`,
      version: null,
      summary: 'TypeScript strictモードの有効化PR',
    })
  )
})

// 処理中ステータスのアクティビティ
const activityDetailProcessingHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        status: 'processing',
        statusDetail: '翻訳処理中です...',
        translatedTitle: null,
        translatedBody: null,
      })
    )
  }
)

// 本文翻訳リクエスト（未翻訳/翻訳中/失敗）状態のアクティビティ
const activityDetailBodyTranslationIdleHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        translatedBody: null,
        bodyTranslationStatus: 'idle',
      })
    )
  }
)

const activityDetailBodyTranslationPollingHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        translatedBody: null,
        bodyTranslationStatus: 'processing',
      })
    )
  }
)

const activityDetailBodyTranslationFailedHandler = http.get(
  '*/api/activities/:activityId',
  () => {
    return HttpResponse.json(
      createActivityDetailResponse({
        translatedBody: null,
        bodyTranslationStatus: 'failed',
      })
    )
  }
)

/**
 * デフォルト表示：翻訳されたリリース情報を表示
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailSuccessHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('翻訳されたタイトルと本文が表示される', async () => {
      await expect(
        await canvas.findByText('facebook/react')
      ).toBeInTheDocument()
      await expect(
        await canvas.findByText('リリース v1.0.0 - 初回リリース')
      ).toBeInTheDocument()
      await expect(await canvas.findByText('翻訳結果')).toBeInTheDocument()
    })

    await step('アクションボタンが表示される', async () => {
      const actions = canvas.getByTestId('activity-actions')
      await expect(actions).toBeInTheDocument()
    })
  },
}

/**
 * 翻訳/原文の切り替え操作
 */
export const WithToggleInteraction: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailSuccessHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('初期状態は翻訳表示', async () => {
      await expect(
        await canvas.findByText('リリース v1.0.0 - 初回リリース')
      ).toBeInTheDocument()
      await expect(await canvas.findByText('翻訳結果')).toBeInTheDocument()
    })

    await step('トグルクリックで原文表示に切り替え', async () => {
      const toggle = await canvas.findByTestId('translation-toggle')
      await userEvent.click(toggle)

      await expect(
        await canvas.findByText('Release v1.0.0 - Initial Release')
      ).toBeInTheDocument()
      await expect(await canvas.findByText('原文')).toBeInTheDocument()
    })

    await step('再度トグルクリックで翻訳表示に戻る', async () => {
      const toggle = await canvas.findByTestId('translation-toggle')
      await userEvent.click(toggle)

      await expect(
        await canvas.findByText('リリース v1.0.0 - 初回リリース')
      ).toBeInTheDocument()
    })
  },
}

/**
 * エラー表示：API呼び出し失敗時
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailErrorHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('読み込みエラー')).toBeInTheDocument()
    await expect(
      await canvas.findByText(
        /アクティビティの読み込み中にエラーが発生しました/
      )
    ).toBeInTheDocument()
    await expect(await canvas.findByText('一覧に戻る')).toBeInTheDocument()
  },
}

/**
 * 404エラー表示：アクティビティが見つからない場合
 */
export const NotFound: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailNotFoundHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText('ページが見つかりません')
    ).toBeInTheDocument()
    await expect(
      await canvas.findByText(
        /お探しのアクティビティは存在しないか、削除された可能性があります/
      )
    ).toBeInTheDocument()
  },
}

/**
 * ローディング状態
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailLoadingHandler],
    },
  },
}

/**
 * 翻訳なし：原文のみ表示、トグルボタンは無効化
 */
export const NoTranslation: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailNoTranslationHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('原文が表示され、トグルが無効化されている', async () => {
      await expect(
        await canvas.findByText('Release v1.0.0 - Initial Release')
      ).toBeInTheDocument()
      await expect(await canvas.findByText('原文')).toBeInTheDocument()

      const toggle = await canvas.findByTestId('translation-toggle')
      await expect(toggle).toBeDisabled()
    })
  },
}

/**
 * Issue タイプのアクティビティ
 */
export const IssueType: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailIssueHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('Issue')).toBeInTheDocument()
    await expect(
      await canvas.findByText('バグ: useEffectクリーンアップでメモリリーク発生')
    ).toBeInTheDocument()
  },
}

/**
 * Pull Request タイプのアクティビティ
 */
export const PullRequestType: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailPRHandler],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText('PR')).toBeInTheDocument()
    await expect(
      await canvas.findByText('feat: TypeScript strictモードサポートを追加')
    ).toBeInTheDocument()
  },
}

/**
 * 処理中ステータス：翻訳が完了していない状態
 */
export const ProcessingStatus: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailProcessingHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('原文が表示され、トグルが無効化されている', async () => {
      await expect(
        await canvas.findByText('Release v1.0.0 - Initial Release')
      ).toBeInTheDocument()

      const toggle = await canvas.findByTestId('translation-toggle')
      await expect(toggle).toBeDisabled()
    })
  },
}

/**
 * 本文翻訳リクエストバナー：未翻訳（idle）
 */
export const BodyTranslationRequestIdle: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailBodyTranslationIdleHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('翻訳リクエストバナー（idle）が表示される', async () => {
      const banner = await canvas.findByTestId('translation-request-banner')
      await expect(banner).toBeInTheDocument()
      await expect(await canvas.findByText('日本語訳がまだありません')).toBeInTheDocument()
      await expect(
        await canvas.findByTestId('request-translation-button')
      ).toBeInTheDocument()
    })
  },
}

/**
 * 本文翻訳リクエストバナー：翻訳中（polling）
 */
export const BodyTranslationRequestPolling: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailBodyTranslationPollingHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('翻訳リクエストバナー（polling）が表示される', async () => {
      const banner = await canvas.findByTestId('translation-request-banner')
      await expect(banner).toBeInTheDocument()
      await expect(
        await canvas.findByText('翻訳中... しばらくお待ちください')
      ).toBeInTheDocument()
      await expect(
        await canvas.findByTestId('translation-processing-indicator')
      ).toBeInTheDocument()
    })
  },
}

/**
 * 本文翻訳リクエストバナー：失敗（failed）
 */
export const BodyTranslationRequestFailed: Story = {
  parameters: {
    msw: {
      handlers: [activityDetailBodyTranslationFailedHandler],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('翻訳リクエストバナー（failed）が表示される', async () => {
      const banner = await canvas.findByTestId('translation-request-banner')
      await expect(banner).toBeInTheDocument()
      await expect(await canvas.findByText('翻訳に失敗しました')).toBeInTheDocument()
      await expect(
        await canvas.findByTestId('retry-translation-button')
      ).toBeInTheDocument()
    })
  },
}
