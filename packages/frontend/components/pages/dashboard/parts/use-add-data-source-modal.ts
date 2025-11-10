import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from '~/composables/use-toast'
import { isGitHubRepositoryUrl } from 'shared'

export interface FormState {
  repositoryUrl: string
  notificationEnabled: boolean
  watchReleases: boolean
  watchIssues: boolean
  watchPullRequests: boolean
}

export interface Props {
  open: boolean
  initialValues?: Partial<FormState>
}

export interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
  (e: 'error', message: string): void
}

export function useAddDataSourceModal(props: Props, emit: Emits) {
  const toast = useToast()

  const defaultValues: FormState = {
    repositoryUrl: '',
    notificationEnabled: true,
    watchReleases: true,
    watchIssues: true,
    watchPullRequests: true,
  }

  const form = reactive<FormState>({
    repositoryUrl: '',
    notificationEnabled: true,
    watchReleases: true,
    watchIssues: true,
    watchPullRequests: true,
  })

  const repositoryError = ref<string | null>(null)
  const submitError = ref<string | null>(null)
  const isSubmitting = ref(false)

  const trimmedRepositoryUrl = computed(() => form.repositoryUrl.trim())

  const isRepositoryUrlValid = computed(() =>
    trimmedRepositoryUrl.value
      ? isGitHubRepositoryUrl(trimmedRepositoryUrl.value)
      : false
  )

  const isSubmitDisabled = computed(
    () => isSubmitting.value || !trimmedRepositoryUrl.value
  )

  const resetForm = () => {
    Object.assign(form, {
      ...defaultValues,
      ...props.initialValues,
    })
    repositoryError.value = null
    submitError.value = null

    if (form.repositoryUrl && !isGitHubRepositoryUrl(form.repositoryUrl)) {
      repositoryError.value =
        'https://github.com/{owner}/{repo} の形式で入力してください。'
    }
  }

  const validateUrl = () => {
    repositoryError.value = null

    if (!trimmedRepositoryUrl.value) {
      return
    }

    if (!isRepositoryUrlValid.value) {
      repositoryError.value =
        'https://github.com/{owner}/{repo} の形式で入力してください。'
    }
  }

  const handleValidation = () => {
    repositoryError.value = null

    if (!trimmedRepositoryUrl.value) {
      repositoryError.value = 'GitHub リポジトリのURLを入力してください。'
      return false
    }

    if (!isRepositoryUrlValid.value) {
      repositoryError.value =
        'https://github.com/{owner}/{repo} の形式で入力してください。'
      return false
    }

    return true
  }

  const extractErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'data' in error) {
      const data = (error as { data?: Record<string, unknown> }).data
      if (data && typeof data.validationError === 'string') {
        return data.validationError
      }
    }

    if (error instanceof Error && error.message) {
      return error.message
    }

    return 'データソースの登録に失敗しました。時間をおいて再度お試しください。'
  }

  const handleSubmit = async () => {
    if (isSubmitting.value) {
      return
    }

    submitError.value = null

    if (!handleValidation()) {
      return
    }

    isSubmitting.value = true

    try {
      await $fetch('/api/data-sources', {
        method: 'POST',
        body: {
          repositoryUrl: trimmedRepositoryUrl.value,
          notificationEnabled: true,
          watchReleases: form.watchReleases,
          watchIssues: form.watchIssues,
          watchPullRequests: form.watchPullRequests,
        },
      })

      toast.showToast({
        intent: 'success',
        title: 'データソースを追加しました',
        message: `${trimmedRepositoryUrl.value} を監視対象に登録しました。`,
      })

      emit('success')
      emit('update:open', false)
      resetForm()
    } catch (error) {
      const message = extractErrorMessage(error)
      submitError.value = message

      toast.showToast({
        intent: 'alert',
        title: 'データソースの追加に失敗しました',
        message,
        duration: null,
      })

      emit('error', message)
    } finally {
      isSubmitting.value = false
    }
  }

  const handleCancel = () => {
    emit('update:open', false)
  }

  // URL入力と同時にバリデーション
  watch(
    () => form.repositoryUrl,
    () => {
      validateUrl()
      if (submitError.value) {
        submitError.value = null
      }
    }
  )

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        resetForm()
      }
    }
  )

  onMounted(() => {
    if (props.open) {
      resetForm()
    }
  })

  return {
    form,
    repositoryError,
    submitError,
    isSubmitting,
    trimmedRepositoryUrl,
    isRepositoryUrlValid,
    isSubmitDisabled,
    resetForm,
    handleSubmit,
    handleCancel,
  }
}
