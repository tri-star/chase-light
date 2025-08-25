<template>
  <div
    class="min-h-screen bg-semantic-content-default-bg text-semantic-content-default-text"
  >
    <!-- ヘッダー -->
    <header
      class="bg-semantic-header-default-bg shadow backdrop-blur-default border-b border-semantic-header-default-border"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-3xl font-bold text-semantic-header-default-text">
              Dashboard
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <ThemeSelector />
            <div class="text-sm text-semantic-content-default-text/80">
              Welcome, {{ user?.name }}
            </div>
            <button
              class="bg-semantic-common-alert-inversed-bg text-semantic-common-alert-inversed-text font-bold py-2 px-4 rounded"
              @click="logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div
          class="border-4 border-dashed border-semantic-surface-secondary-default-border rounded-lg p-6"
        >
          <h2
            class="text-2xl font-semibold text-semantic-content-default-text mb-4"
          >
            User Information
          </h2>

          <div
            class="bg-semantic-surface-secondary-default-bg overflow-hidden shadow rounded-lg border border-semantic-surface-secondary-default-border"
          >
            <div class="px-4 py-5 sm:p-6">
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt
                    class="text-sm font-medium text-semantic-content-default-text/60"
                  >
                    User ID
                  </dt>
                  <dd class="mt-1 text-sm text-semantic-content-default-text">
                    {{ user?.id }}
                  </dd>
                </div>
                <div>
                  <dt
                    class="text-sm font-medium text-semantic-content-default-text/60"
                  >
                    Email
                  </dt>
                  <dd class="mt-1 text-sm text-semantic-content-default-text">
                    {{ user?.email }}
                  </dd>
                </div>
                <div>
                  <dt
                    class="text-sm font-medium text-semantic-content-default-text/60"
                  >
                    Name
                  </dt>
                  <dd class="mt-1 text-sm text-semantic-content-default-text">
                    {{ user?.name }}
                  </dd>
                </div>
                <div>
                  <dt
                    class="text-sm font-medium text-semantic-content-default-text/60"
                  >
                    Provider
                  </dt>
                  <dd class="mt-1 text-sm text-semantic-content-default-text">
                    {{ user?.provider }}
                  </dd>
                </div>
                <!-- <div>
                  <dt class="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ formatDate(loggedInAt) }}
                  </dd>
                </div> -->
              </dl>

              <div v-if="user?.avatar" class="mt-6">
                <dt
                  class="text-sm font-medium text-semantic-content-default-text/60 mb-2"
                >
                  Avatar
                </dt>
                <img
                  :src="user.avatar"
                  :alt="user.name"
                  class="h-20 w-20 rounded-full"
                />
              </div>
            </div>
          </div>

          <!-- データソース一覧 -->
          <div class="mt-8">
            <h3
              class="text-lg font-medium text-semantic-content-default-text mb-4"
            >
              データソース一覧
            </h3>
            <div class="space-y-4">
              <button
                class="bg-semantic-surface-primary-default-bg hover:bg-semantic-surface-primary-hovered-bg text-semantic-surface-primary-default-text font-bold py-2 px-4 rounded"
                :disabled="dataSourcesLoading"
                data-testid="fetch-data-sources-button"
                @click="fetchDataSources"
              >
                {{
                  dataSourcesLoading ? '読み込み中...' : 'データソースを取得'
                }}
              </button>

              <div
                v-if="dataSourcesError"
                class="bg-semantic-common-alert-default-bg text-semantic-common-alert-default-text border border-semantic-common-alert-default-border p-4 rounded"
              >
                エラー: {{ dataSourcesError }}
              </div>

              <div
                v-if="dataSources && dataSources.data"
                class="bg-semantic-surface-secondary-default-bg shadow overflow-hidden sm:rounded-md border border-semantic-surface-secondary-default-border"
              >
                <div class="px-4 py-5 sm:p-6">
                  <div class="mb-4">
                    <p class="text-sm text-semantic-content-default-text/80">
                      {{ dataSources.data.pagination.total }} 件中
                      {{
                        (dataSources.data.pagination.page - 1) *
                          dataSources.data.pagination.perPage +
                        1
                      }}
                      -
                      {{
                        Math.min(
                          dataSources.data.pagination.page *
                            dataSources.data.pagination.perPage,
                          dataSources.data.pagination.total
                        )
                      }}
                      件を表示
                    </p>
                  </div>

                  <ul
                    v-if="dataSources.data.items.length > 0"
                    class="divide-y divide-semantic-surface-secondary-default-border"
                  >
                    <li
                      v-for="item in dataSources.data.items"
                      :key="item.dataSource.id"
                      class="py-4"
                    >
                      <div class="flex items-center space-x-4">
                        <div class="flex-1 min-w-0">
                          <p
                            class="text-sm font-medium text-semantic-content-default-text truncate"
                          >
                            {{ item.dataSource.name }}
                          </p>
                          <p
                            class="text-sm text-semantic-content-default-text/80 truncate"
                          >
                            {{ item.dataSource.repository.fullName }}
                          </p>
                          <p
                            class="text-xs text-semantic-content-default-text/60"
                          >
                            スター:
                            {{ item.dataSource.repository.starsCount }} |
                            フォーク:
                            {{ item.dataSource.repository.forksCount }} | 言語:
                            {{ item.dataSource.repository.language || 'N/A' }}
                          </p>
                        </div>
                        <div
                          class="text-sm text-semantic-content-default-text/80"
                        >
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="
                              item.dataSource.isPrivate
                                ? 'bg-semantic-common-alert-default-bg text-semantic-common-alert-default-text'
                                : 'bg-semantic-common-success-default-bg text-semantic-common-success-default-text'
                            "
                          >
                            {{
                              item.dataSource.isPrivate ? 'Private' : 'Public'
                            }}
                          </span>
                        </div>
                      </div>
                    </li>
                  </ul>

                  <div v-else class="text-center py-8">
                    <p class="text-semantic-content-default-text/60">
                      データソースが見つかりません
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- データソース追加 -->
          <div class="mt-8">
            <h3
              class="text-lg font-medium text-semantic-content-default-text mb-4"
            >
              データソースを追加
            </h3>
            <div class="space-y-4">
              <div class="flex space-x-4">
                <input
                  v-model="newRepositoryUrl"
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  class="flex-1 bg-semantic-interactive-default-bg border border-semantic-interactive-default-border text-semantic-interactive-default-text rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-semantic-common-focus-default-color focus:border-semantic-interactive-focused-border"
                  :disabled="addLoading"
                />
                <button
                  class="bg-semantic-common-success-inversed-bg text-semantic-common-success-inversed-text font-bold py-2 px-4 rounded disabled:opacity-50"
                  :disabled="addLoading || !newRepositoryUrl"
                  data-testid="add-data-source-button"
                  @click="addDataSource"
                >
                  {{ addLoading ? '追加中...' : '追加' }}
                </button>
              </div>

              <div
                v-if="addError"
                class="bg-semantic-common-alert-default-bg text-semantic-common-alert-default-text border border-semantic-common-alert-default-border p-4 rounded"
              >
                エラー: {{ addError }}
              </div>

              <div
                v-if="addSuccess"
                class="bg-semantic-common-success-default-bg text-semantic-common-success-default-text border border-semantic-common-success-default-border p-4 rounded"
              >
                データソースが正常に追加されました！
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { DataSourceListResponse } from '~/generated/api/schemas'

definePageMeta({
  middleware: 'auth',
})

const { user, logout } = useAuth()

const dataSourcesLoading = ref(false)
const dataSources = ref<DataSourceListResponse | null>(null)
const dataSourcesError = ref('')

// データソース追加用の状態
const newRepositoryUrl = ref('')
const addLoading = ref(false)
const addError = ref('')
const addSuccess = ref(false)

const fetchDataSources = async () => {
  dataSourcesLoading.value = true
  dataSourcesError.value = ''
  dataSources.value = null

  try {
    const result = await $fetch('/api/data-sources', {
      params: {
        page: 1,
        perPage: 10,
      },
    })
    dataSources.value = result
  } catch (error) {
    console.error('Fetch error:', error)
    dataSourcesError.value =
      error instanceof Error ? error.message : 'Unknown error'
  } finally {
    dataSourcesLoading.value = false
  }
}

const addDataSource = async () => {
  if (!newRepositoryUrl.value) return

  addLoading.value = true
  addError.value = ''
  addSuccess.value = false

  try {
    await $fetch('/api/data-sources', {
      method: 'POST',
      body: {
        repositoryUrl: newRepositoryUrl.value,
        notificationEnabled: true,
        watchReleases: true,
        watchIssues: false,
        watchPullRequests: false,
      },
    })

    addSuccess.value = true
    newRepositoryUrl.value = ''

    // データソース一覧を再取得
    setTimeout(() => {
      fetchDataSources()
      addSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Add data source error:', error)
    addError.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    addLoading.value = false
  }
}
</script>
