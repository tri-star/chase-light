import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ClDivider from './ClDivider.vue'

const meta: Meta<typeof ClDivider> = {
  title: 'Components/Base/ClDivider',
  component: ClDivider,
  parameters: {
    docs: {
      description: {
        component:
          'リストやコンテンツの区切り線を描画するコンポーネント。デフォルトは点線で、縦方向の余白量をプリセットから選択できます。',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['dashed', 'solid'],
    },
    spacing: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ClDivider },
    template: `
      <div class="space-y-6 p-4 bg-content-default">
        <div>
          <p class="text-sm text-card-value">前のコンテンツ</p>
        </div>
        <ClDivider />
        <div>
          <p class="text-sm text-card-value">次のコンテンツ</p>
        </div>
      </div>
    `,
  }),
}

export const Variants: Story = {
  render: () => ({
    components: { ClDivider },
    template: `
      <div class="space-y-10 p-4 bg-content-default">
        <div>
          <p class="text-sm text-card-value mb-2">Dashed (default)</p>
          <ClDivider variant="dashed" />
        </div>
        <div>
          <p class="text-sm text-card-value mb-2">Solid</p>
          <ClDivider variant="solid" />
        </div>
      </div>
    `,
  }),
}

export const Spacing: Story = {
  render: () => ({
    components: { ClDivider },
    template: `
      <div class="space-y-6 p-4 bg-content-default">
        <div>
          <p class="text-sm text-card-value mb-2">Spacing: none</p>
          <ClDivider spacing="none" />
        </div>
        <div>
          <p class="text-sm text-card-value mb-2">Spacing: sm</p>
          <ClDivider spacing="sm" />
        </div>
        <div>
          <p class="text-sm text-card-value mb-2">Spacing: md</p>
          <ClDivider spacing="md" />
        </div>
        <div>
          <p class="text-sm text-card-value mb-2">Spacing: lg</p>
          <ClDivider spacing="lg" />
        </div>
      </div>
    `,
  }),
}
