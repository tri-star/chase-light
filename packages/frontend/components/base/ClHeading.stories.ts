import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClHeading from './ClHeading.vue'

const meta: Meta<typeof ClHeading> = {
  title: 'Components/Base/ClHeading',
  component: ClHeading,
  parameters: {
    docs: {
      description: {
        component:
          '見出しコンポーネント。レベル1～3に対応し、それぞれ異なるフォントサイズが適用されます。',
      },
    },
  },
  argTypes: {
    level: {
      control: { type: 'select' },
      options: [1, 2, 3],
      description: '見出しのレベル（h1, h2, h3）',
      table: {
        type: { summary: '1 | 2 | 3' },
        defaultValue: { summary: '1' },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <ClHeading>
        デフォルトの見出し
      </ClHeading>
    `,
  }),
}

export const Level1: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <ClHeading :level="1">
        レベル1の見出し（最大）
      </ClHeading>
    `,
  }),
}

export const Level2: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <ClHeading :level="2">
        レベル2の見出し（中）
      </ClHeading>
    `,
  }),
}

export const Level3: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <ClHeading :level="3">
        レベル3の見出し（小）
      </ClHeading>
    `,
  }),
}

export const AllLevelsComparison: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <div class="space-y-6 p-4">
        <div>
          <ClHeading :level="1">
            レベル1の見出し
          </ClHeading>
          <p class="text-sm text-gray-500 mt-2">--typography-scale-4xl</p>
        </div>

        <div>
          <ClHeading :level="2">
            レベル2の見出し
          </ClHeading>
          <p class="text-sm text-gray-500 mt-2">--typography-scale-2xl</p>
        </div>

        <div>
          <ClHeading :level="3">
            レベル3の見出し
          </ClHeading>
          <p class="text-sm text-gray-500 mt-2">--typography-scale-xl</p>
        </div>
      </div>
    `,
  }),
}

export const WithLongText: Story = {
  render: () => ({
    components: { ClHeading },
    template: `
      <div class="space-y-6 p-4 max-w-2xl">
        <ClHeading :level="1">
          これは非常に長い見出しテキストで、複数行にわたる場合の表示を確認するためのものです
        </ClHeading>

        <ClHeading :level="2">
          レベル2の長い見出しで、改行が発生した場合のスタイリングを確認します
        </ClHeading>

        <ClHeading :level="3">
          レベル3でも同様に長いテキストでの見た目を確認します
        </ClHeading>
      </div>
    `,
  }),
}
