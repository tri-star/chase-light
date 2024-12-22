import type { ValidationError } from "@tanstack/vue-form"
import { getH3ErrorData } from "~/lib/utils/h3-utils"

type ValidationState = "valid" | "invalid" | "pending" | "initial"

export function useFeedUrlValidation() {
  const validationState = ref<ValidationState>("initial")
  const isLoading = computed(() => {
    if (validationState.value === "pending") {
      return true
    }
    return false
  })

  const isValidated = computed(() => {
    if (["initial", "pending"].includes(validationState.value)) {
      return false
    }
    return true
  })

  async function validateFeedUrl(url: string): Promise<ValidationError> {
    validationState.value = "pending"

    const { error } = await useFetch("/api/feeds/validate-url", {
      query: {
        url,
      },
    })

    const errorData = getH3ErrorData<{ code: string }>(error.value)
    const errorCode = errorData?.code
    if (errorCode) {
      if (errorCode === "duplicated") {
        validationState.value = "invalid"
        return "このURLはすでに登録されています"
      } else if (errorCode === "not-supported") {
        validationState.value = "invalid"
        return "URLは 'https://gitHub.com/owner/repo' 形式で入力してください"
      }
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
