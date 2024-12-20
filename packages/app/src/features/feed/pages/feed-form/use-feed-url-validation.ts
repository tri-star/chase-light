import type { ValidationError } from "@tanstack/vue-form"

type ValidationState = "valid" | "invalid" | "pending" | "initial"

export function useFeedUrlValidation() {
  const validationState = ref<ValidationState>("initial")
  const isLoading = computed(() => {
    if (validationState.value === "pending") {
      return true
    }
  })

  const isValidated = computed(() => {
    if (["initial", "pending"].includes(validationState.value)) {
      return false
    }
    return true
  })

  async function validateFeedUrl(url: string): Promise<ValidationError> {
    validationState.value = "pending"
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // TODO: API呼び出ししてエラーコードで判別
    if (!url.match(/github.com/)) {
      validationState.value = "invalid"
      return "現在はGitHubのURLのみ対応しています"
    }
    if (url !== "https://github.com/ok") {
      validationState.value = "invalid"
      return "対応していないリポジトリです"
    }
    validationState.value = "valid"
    return undefined
  }

  return {
    validationState,
    validateFeedUrl,
    isLoading,
    isValidated,
  }
}
