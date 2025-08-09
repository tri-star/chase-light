<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">Welcome, {{ user?.name }}</div>
            <button
              class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
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
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-6">
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">
            User Information
          </h2>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">User ID</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ user?.id }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Email</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ user?.email }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Name</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ user?.name }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Provider</dt>
                  <dd class="mt-1 text-sm text-gray-900">
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
                <dt class="text-sm font-medium text-gray-500 mb-2">Avatar</dt>
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
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              データソース一覧
            </h3>
            <div class="space-y-4">
              <button
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
                class="bg-red-100 p-4 rounded text-red-700"
              >
                エラー: {{ dataSourcesError }}
              </div>

              <div
                v-if="dataSources && dataSources.data"
                class="bg-white shadow overflow-hidden sm:rounded-md"
              >
                <div class="px-4 py-5 sm:p-6">
                  <div class="mb-4">
                    <p class="text-sm text-gray-600">
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
                    class="divide-y divide-gray-200"
                  >
                    <li
                      v-for="item in dataSources.data.items"
                      :key="item.dataSource.id"
                      class="py-4"
                    >
                      <div class="flex items-center space-x-4">
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {{ item.dataSource.name }}
                          </p>
                          <p class="text-sm text-gray-500 truncate">
                            {{ item.repository.fullName }}
                          </p>
                          <p class="text-xs text-gray-400">
                            スター: {{ item.repository.starsCount }} | フォーク:
                            {{ item.repository.forksCount }} | 言語:
                            {{ item.repository.language || 'N/A' }}
                          </p>
                        </div>
                        <div class="text-sm text-gray-500">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="
                              item.dataSource.isPrivate
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
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
                    <p class="text-gray-500">データソースが見つかりません</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- データソース追加 -->
          <div class="mt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              データソースを追加
            </h3>
            <div class="space-y-4">
              <div class="flex space-x-4">
                <input
                  v-model="newRepositoryUrl"
                  type="text"
                  placeholder="https://github.com/owner/repo"
                  class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :disabled="addLoading"
                />
                <button
                  class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  :disabled="addLoading || !newRepositoryUrl"
                  data-testid="add-data-source-button"
                  @click="addDataSource"
                >
                  {{ addLoading ? '追加中...' : '追加' }}
                </button>
              </div>

              <div v-if="addError" class="bg-red-100 p-4 rounded text-red-700">
                エラー: {{ addError }}
              </div>

              <div
                v-if="addSuccess"
                class="bg-green-100 p-4 rounded text-green-700"
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
