import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ClFabButton from '../ClFabButton.vue'

describe('ClFabButton', () => {
  it('renders label and icon', () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: 'データソースを追加',
      },
    })

    expect(wrapper.attributes('aria-label')).toBe('データソースを追加')
    expect(wrapper.find('span.hidden').text()).toBe('データソースを追加')
    expect(wrapper.find('.i-heroicons-plus-20-solid').exists()).toBe(true)
  })

  it('emits click event', async () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: '追加',
      },
    })

    await wrapper.get('[data-testid="fab-button"]').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies large size classes', () => {
    const wrapper = mount(ClFabButton, {
      props: {
        label: '追加',
        size: 'lg',
      },
    })

    expect(wrapper.classes()).toContain('h-14')
  })
})
