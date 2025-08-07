<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ナビゲーション -->
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink to="/dashboard" class="text-xl font-bold text-gray-900">
              Chase Light
            </NuxtLink>
            <div class="ml-10 flex items-baseline space-x-4">
              <NuxtLink
                to="/dashboard"
                class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/profile"
                class="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <button
              class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              @click="logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- メインコンテンツ -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="space-y-6">
          <!-- プロファイル情報 -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Profile Information
              </h3>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div class="mt-1 text-sm text-gray-900">
                    {{ user?.name || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div class="mt-1 text-sm text-gray-900">
                    {{ user?.email || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <div class="mt-1 text-sm text-gray-900">
                    {{ user?.id || 'N/A' }}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">
                    Authentication Provider
                  </label>
                  <div
                    data-testid="auth-provider"
                    class="mt-1 text-sm text-gray-900"
                  >
                    {{ user?.provider || 'N/A' }}
                  </div>
                </div>
              </div>

              <div v-if="user?.avatar" class="mt-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
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
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                GitHub Integration Test
              </h3>

              <div class="space-y-4">
                <div>
                  <button
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
                    :disabled="loading"
                    @click="testGitHubUser"
                  >
                    {{ loading ? 'Loading...' : 'Test GitHub User API' }}
                  </button>

                  <button
                    class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    :disabled="loading"
                    @click="testGitHubRepos"
                  >
                    {{ loading ? 'Loading...' : 'Test GitHub Repos API' }}
                  </button>
                </div>

                <div
                  v-if="apiResult"
                  class="bg-gray-100 p-4 rounded overflow-auto max-h-96"
                >
                  <pre class="text-sm">{{ apiResult }}</pre>
                </div>

                <div
                  v-if="apiError"
                  class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
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
