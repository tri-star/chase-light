import { computed, onMounted, ref, watch } from 'vue'
import { useForm } from '@tanstack/vue-form'
import { useToast } from '~/composables/use-toast'
import { isGitHubRepositoryUrl } from 'shared'

export interface FormState {
  repositoryUrl: string
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
    watchReleases: true,
    watchIssues: true,
    watchPullRequests: true,
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      submitError.value = null

      const trimmedRepositoryUrl = value.repositoryUrl.trim()

      try {
        await $fetch('/api/data-sources', {
          method: 'POST',
          body: {
            repositoryUrl: trimmedRepositoryUrl,
            notificationEnabled: true,
            watchReleases: value.watchReleases,
            watchIssues: value.watchIssues,
            watchPullRequests: value.watchPullRequests,
          },
        })

        toast.showToast({
          intent: 'success',
          title: 'データソースを追加しました',
          message: `${trimmedRepositoryUrl} を監視対象に登録しました。`,
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
        throw error
      }
    },
  })

  const submitError = ref<string | null>(null)
  const repositoryUrlValue = form.useStore(
    (state) => state.values.repositoryUrl ?? ''
  )
  const trimmedRepositoryUrl = computed(() => repositoryUrlValue.value.trim())

  const repositoryValidatorMessages = {
    required: 'GitHub リポジトリのURLを入力してください。',
    invalid: 'https://github.com/{owner}/{repo} の形式で入力してください。',
  }

  const repositoryFieldValidators = {
    onChange: ({ value }: { value: string }) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return undefined
      }
      if (!isGitHubRepositoryUrl(trimmed)) {
        return repositoryValidatorMessages.invalid
      }
      return undefined
    },
    onSubmit: ({ value }: { value: string }) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return repositoryValidatorMessages.required
      }
      if (!isGitHubRepositoryUrl(trimmed)) {
        return repositoryValidatorMessages.invalid
      }
      return undefined
    },
  }

  const resetForm = () => {
    form.reset({
      ...defaultValues,
      ...props.initialValues,
    })
    submitError.value = null

    if (trimmedRepositoryUrl.value) {
      void form.validateField('repositoryUrl', 'change')
    }
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

  const handleSubmit = () => form.handleSubmit().catch(() => undefined)

  const handleCancel = () => {
    emit('update:open', false)
  }

  watch(repositoryUrlValue, () => {
    if (submitError.value) {
      submitError.value = null
    }
  })

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
    repositoryFieldValidators,
    submitError,
    resetForm,
    handleSubmit,
    handleCancel,
  }
}
