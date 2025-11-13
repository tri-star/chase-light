import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import ClFabButton from '../ClFabButton.vue'

describe('ClFabButton', () => {
  test('renders label and icon', () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: 'データソースを追加',
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('データソースを追加')
    expect(wrapper.find('span.hidden').text()).toBe('データソースを追加')
  })

  test('emits click event', async () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: '追加',
      },
    })

    await wrapper.get('[data-testid="fab-button"]').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  test('applies large size classes', () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: '追加',
        size: 'lg',
      },
    })

    expect(wrapper.classes()).toContain('h-14')
  })

  test('デフォルトでbottom-right配置となる', () => {
    const wrapper = mount(ClFabButton)

    expect(wrapper.classes()).toContain('fixed')
    expect(wrapper.classes()).toContain('bottom-5')
    expect(wrapper.classes()).toContain('right-5')
  })

  test('z-fabクラスが適用される', () => {
    const wrapper = mount(ClFabButton)

    expect(wrapper.classes()).toContain('z-fab')
  })

  test.each([
    ['bottom-right', ['bottom-5', 'right-5']],
    ['bottom-left', ['bottom-5', 'left-5']],
    ['top-right', ['top-5', 'right-5']],
    ['top-left', ['top-5', 'left-5']],
  ] as const)(
    'position propsによって適切なクラスが適用される: %s',
    (position, expectedClasses) => {
      const wrapper = mount(ClFabButton, {
        props: { position },
      })

      const classes = wrapper.classes()
      expect(classes).toContain('fixed')
      expect(classes).toContain('z-fab')
      expectedClasses.forEach((cls) => {
        expect(classes).toContain(cls)
      })
    }
  )
})
