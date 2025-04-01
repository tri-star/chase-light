import type { Meta, StoryObj } from '@storybook/vue3'

import { defaultLayoutDecorator } from '~/stories/default-layout-decorator'
import A3TextField from '~/components/common/A3TextField.vue'
import A3TextFieldIcon from '~/components/common/A3TextFieldIcon.vue'

const meta = {
  title: 'Components/A3TextField',
  component: A3TextField,
  tags: ['autodocs'],
  decorators: [defaultLayoutDecorator],
} satisfies Meta<typeof A3TextField>

export default meta
type Story = StoryObj<typeof meta> & {
  args: {
    icon?: string
  }
}

export const A3TextFieldPlaygroundStory: Story = {
  name: 'Playground',
  args: {
    placeHolder: '入力してください',
    disabled: false,
    error: false,
    loading: false,
  },
  render: (args: unknown) => ({
    components: { A3TextField },
    setup() {
      return { args }
    },
    template: '<A3TextField v-bind="args" />',
  }),
}

export const A3TextFieldTailIconStory: Story = {
  name: 'TailIcon',
  args: {
    placeHolder: '入力してください',
    disabled: false,
    error: false,
    icon: 'material-symbols:close',
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'テキストフィールドの末尾にアイコンを表示します。',
      },
    },
  },
  render: (args: unknown) => ({
    components: { A3TextField, A3TextFieldIcon },
    setup() {
      return { args }
    },
    template: //
    `<A3TextField v-bind="args">
        <template v-slot:tail-icon="slotProps">
          <A3TextFieldIcon :name="args.icon" v-bind="slotProps" />
        </template>
      </A3TextField>`,
  }),
}
