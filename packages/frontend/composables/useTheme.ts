interface ThemeConfig {
  theme: Readonly<Ref<'light' | 'dark' | 'system'>>
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  currentTheme: Readonly<Ref<'light' | 'dark'>>
}

const THEME_STORAGE_KEY = 'chase-light-theme'

/**
 * テーマ管理用のComposable
 * ライトモード/ダークモード/システム設定の切り替えを提供
 */
export function useTheme(): ThemeConfig {
  // リアクティブなテーマ設定
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const systemPrefersDark = ref(false)

  // 現在の実際のテーマ（systemの場合はシステム設定を反映）
  const currentTheme = computed(() => {
    if (theme.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  /**
   * システムのprefers-color-schemeを監視
   */
  const watchSystemTheme = () => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // 初期値を設定
    systemPrefersDark.value = mediaQuery.matches

    // 変更を監視
    const handleChange = (event: MediaQueryListEvent) => {
      systemPrefersDark.value = event.matches
    }

    mediaQuery.addEventListener('change', handleChange)

    // クリーンアップ関数を返す
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }

  /**
   * HTML要素にdata-theme属性を適用
   */
  const applyThemeToDOM = (themeValue: 'light' | 'dark') => {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    html.setAttribute('data-theme', themeValue)

    // bodyクラスも設定（互換性のため）
    document.body.classList.toggle('dark', themeValue === 'dark')
    document.body.classList.toggle('light', themeValue === 'light')
  }

  /**
   * ローカルストレージからテーマ設定を読み込み
   */
  const loadThemeFromStorage = () => {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        theme.value = stored as 'light' | 'dark' | 'system'
      }
    } catch (error) {
      console.warn('テーマ設定の読み込みに失敗しました:', error)
    }
  }

  /**
   * テーマ設定をローカルストレージに保存
   */
  const saveThemeToStorage = (themeValue: 'light' | 'dark' | 'system') => {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeValue)
    } catch (error) {
      console.warn('テーマ設定の保存に失敗しました:', error)
    }
  }

  /**
   * テーマを設定
   */
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    // バリデーション
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn('無効なテーマが指定されました:', newTheme)
      return
    }

    theme.value = newTheme
    saveThemeToStorage(newTheme)
  }

  // currentThemeの変更をDOMに反映
  watch(
    currentTheme,
    (newTheme) => {
      applyThemeToDOM(newTheme)
    },
    { immediate: true }
  )

  // 初期化処理
  onMounted(() => {
    loadThemeFromStorage()
    const cleanup = watchSystemTheme()

    // コンポーネントのアンマウント時にクリーンアップ
    onBeforeUnmount(() => {
      cleanup?.()
    })
  })

  // SSRの場合は初期値を適用
  if (typeof window === 'undefined') {
    // サーバーサイドでは常にlightテーマを使用
    applyThemeToDOM('light')
  }

  return {
    theme: readonly(theme),
    setTheme,
    currentTheme: readonly(currentTheme),
  }
}
