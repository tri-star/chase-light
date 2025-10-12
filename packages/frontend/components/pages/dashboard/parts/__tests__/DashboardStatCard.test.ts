import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardStatCard, {
  type DashboardStatCardProps,
} from '../DashboardStatCard.vue'

const factory = (
  props: DashboardStatCardProps,
  slots: Record<string, string> = {}
) => {
  return mount(DashboardStatCard, {
    props,
    slots,
  })
}

describe('DashboardStatCard', () => {
  test('基本的なラベルと値が表示される', () => {
    const wrapper = factory({ label: 'ウォッチ中リポジトリ', value: 12 })

    const label = wrapper.find('p.text-card-label')
    const value = wrapper.find('p.text-card-value')

    expect({
      labelText: label.text(),
      labelTitle: label.attributes('title'),
      hasLineClamp: label.classes().includes('line-clamp-2'),
    }).toEqual({
      labelText: 'ウォッチ中リポジトリ',
      labelTitle: 'ウォッチ中リポジトリ',
      hasLineClamp: true,
    })

    expect({
      valueText: value.text(),
      hasFontClass: value.classes().includes('font-semibold'),
      hasSizeClass: value.classes().includes('text-2xl'),
    }).toEqual({
      valueText: '12',
      hasFontClass: true,
      hasSizeClass: true,
    })
  })

  test('icon props を指定した場合に Icon コンポーネントが描画される', () => {
    const wrapper = factory({
      label: '通知',
      value: '0',
      icon: 'i-heroicons-bell',
      iconClass: 'text-status-info-default',
    })

    const iconWrapper = wrapper.find('span.iconify')

    expect({
      exists: iconWrapper.exists(),
      iconName: iconWrapper.attributes('class')?.includes('i-heroicons:bell'),
      iconColor: iconWrapper
        .attributes('class')
        ?.includes('text-status-info-default'),
      ariaHidden: iconWrapper.attributes('aria-hidden'),
    }).toEqual({
      exists: true,
      iconName: true,
      iconColor: true,
      ariaHidden: 'true',
    })
  })

  test('icon スロットを指定した場合はそちらが優先される', () => {
    const wrapper = factory(
      { label: 'カスタム', value: 'OK', icon: 'i-heroicons-bell' },
      {
        icon: '<span class="custom-icon">slot-icon</span>',
      }
    )

    expect({
      usesSlot: wrapper.find('.custom-icon').exists(),
      iconRendered: wrapper.find('span.iconify').exists(),
    }).toEqual({
      usesSlot: true,
      iconRendered: false,
    })
  })

  test('disabled の場合は属性とクラスが適切に付与される', () => {
    const wrapper = factory({
      label: '無効カード',
      value: 'N/A',
      disabled: true,
    })

    const root = wrapper.find('[aria-disabled="true"]')

    expect({
      exists: root.exists(),
      hasOpacity: root.classes().includes('opacity-50'),
      hasCursor: root.classes().includes('cursor-not-allowed'),
      hasHover: root.classes().includes('hover:bg-card-hovered'),
      tabindex: root.attributes('tabindex'),
    }).toEqual({
      exists: true,
      hasOpacity: true,
      hasCursor: true,
      hasHover: false,
      tabindex: undefined,
    })
  })

  test('suffix スロットの内容が表示される', () => {
    const wrapper = factory(
      { label: '今日の更新', value: '4' },
      {
        suffix: '<span class="text-xs">件</span>',
      }
    )

    expect(wrapper.find('.text-xs').text()).toBe('件')
  })

  test('デフォルト状態でも tabindex は付与されない', () => {
    const wrapper = factory({ label: '総数', value: 100 })

    expect(wrapper.find('[tabindex]').exists()).toBe(false)
  })

  test('icon を指定しない場合はアイコン領域がレンダリングされない', () => {
    const wrapper = factory({ label: 'シンプル', value: '1' })

    expect(wrapper.find('span.iconify').exists()).toBe(false)
    expect(wrapper.find('.custom-icon').exists()).toBe(false)
  })
})
