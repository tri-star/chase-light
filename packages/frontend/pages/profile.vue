<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- ナビゲーション -->
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex items-center">
            <NuxtLink to="/dashboard" class="text-xl text-gray-900 font-bold">
              Chase Light
            </NuxtLink>
            <div class="ml-10 flex items-baseline space-x-4">
              <NuxtLink
                to="/dashboard"
                class="text-sm text-gray-500 hover:text-gray-900 rounded-md px-3
                  py-2 font-medium"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/profile"
                class="bg-gray-900 text-sm text-white rounded-md px-3 py-2
                  font-medium"
              >
                Profile
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <button
              class="rounded bg-red-600 text-white hover:bg-red-700 px-4 py-2
                font-bold"
              @click="logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- メインコンテンツ -->
    <main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="space-y-6">
          <!-- プロファイル情報 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg text-gray-900 mb-4 leading-6 font-medium">
                Profile Information
              </h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label class="text-sm text-gray-700 block font-medium">
                    Name
                  </label>
                  <div class="text-sm text-gray-900 mt-1">
                    {{ user?.name || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="text-sm text-gray-700 block font-medium">
                    Email
                  </label>
                  <div class="text-sm text-gray-900 mt-1">
                    {{ user?.email || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="text-sm text-gray-700 block font-medium">
                    User ID
                  </label>
                  <div class="text-sm text-gray-900 mt-1">
                    {{ user?.id || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="text-sm text-gray-700 block font-medium">
                    Authentication Provider
                  </label>
                  <div
                    data-testid="auth-provider"
                    class="text-sm text-gray-900 mt-1"
                  >
                    {{ user?.provider || 'N/A' }}
                  </div>
                </div>
              </div>

              <div v-if="user?.avatar" class="mt-6">
                <label class="text-sm text-gray-700 mb-2 block font-medium">
                  Avatar
                </label>
                <img
                  :src="user.avatar"
                  :alt="user.name"
                  class="h-24 w-24 rounded-full"
                />
              </div>
            </div>
          </div>

          <!-- GitHub API テスト -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg text-gray-900 mb-4 leading-6 font-medium">
                GitHub Integration Test
              </h3>

              <div class="space-y-4">
                <div>
                  <button
                    class="rounded bg-blue-600 text-white hover:bg-blue-700 mr-4
                      px-4 py-2 font-bold"
                    :disabled="loading"
                    @click="testGitHubUser"
                  >
                    {{ loading ? 'Loading...' : 'Test GitHub User API' }}
                  </button>

                  <button
                    class="rounded bg-green-600 text-white hover:bg-green-700
                      px-4 py-2 font-bold"
                    :disabled="loading"
                    @click="testGitHubRepos"
                  >
                    {{ loading ? 'Loading...' : 'Test GitHub Repos API' }}
                  </button>
                </div>

                <div
                  v-if="apiResult"
                  class="rounded bg-gray-100 max-h-96 overflow-auto p-4"
                >
                  <pre class="text-sm">{{ apiResult }}</pre>
                </div>

                <div
                  v-if="apiError"
                  class="rounded border-red-400 bg-red-100 text-red-700 border
                    px-4 py-3"
                >
                  <strong class="font-bold">Error:</strong>
                  <span class="block sm:inline">{{ apiError }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const { user, logout } = useAuth()

const loading = ref(false)
const apiResult = ref('')
const apiError = ref('')

const clearResults = () => {
  apiResult.value = ''
  apiError.value = ''
}

const testGitHubUser = async () => {
  loading.value = true
  clearResults()

  try {
    const result = await $fetch('/api/github/user')
    apiResult.value = JSON.stringify(result, null, 2)
  } catch (error) {
    apiError.value = error.message || 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

const testGitHubRepos = async () => {
  loading.value = true
  clearResults()

  try {
    const result = await $fetch('/api/github/repos?per_page=5')
    apiResult.value = JSON.stringify(result, null, 2)
  } catch (error) {
    apiError.value = error.message || 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}
</script>
