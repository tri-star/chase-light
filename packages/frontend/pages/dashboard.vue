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

          <!-- API テスト -->
          <div class="mt-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Protected API Test
            </h3>
            <div class="space-y-4">
              <button
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                :disabled="apiLoading"
                data-testid="protected-api-button"
                @click="testProtectedApi"
              >
                {{ apiLoading ? 'Testing...' : 'Test Protected API' }}
              </button>

              <div v-if="apiResult" class="bg-gray-100 p-4 rounded">
                <pre>{{ apiResult }}</pre>
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
});

const { user, logout } = useAuth();

const apiLoading = ref(false);
const apiResult = ref('');

const testProtectedApi = async () => {
  apiLoading.value = true;
  apiResult.value = '';

  try {
    const result = await $fetch('/api/protected/test');
    apiResult.value = JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Fetch error:', error);
    apiResult.value = `Error: ${error.message}`;
  } finally {
    apiLoading.value = false;
  }
};
</script>
