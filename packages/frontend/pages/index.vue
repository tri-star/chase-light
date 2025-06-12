<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-16">
      <!-- ヘッダー -->
      <header class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">
          Chase Light
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          GitHub Repository Activity Tracker
        </p>
        <div class="flex justify-center space-x-4">
          <button
            v-if="!isLoggedIn"
            @click="login"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Login with GitHub
          </button>
          <NuxtLink
            v-else
            to="/dashboard"
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Go to Dashboard
          </NuxtLink>
        </div>
      </header>

      <!-- 機能説明 -->
      <section class="grid md:grid-cols-3 gap-8 mb-16">
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl mb-4">👀</div>
          <h3 class="text-xl font-semibold mb-2">Repository Monitoring</h3>
          <p class="text-gray-600">
            Track activity across your favorite GitHub repositories in real-time.
          </p>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl mb-4">🔔</div>
          <h3 class="text-xl font-semibold mb-2">Smart Notifications</h3>
          <p class="text-gray-600">
            Get notified about important events like releases, issues, and pull requests.
          </p>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl font-semibold mb-2">Analytics Dashboard</h3>
          <p class="text-gray-600">
            Visualize repository trends and activity patterns with detailed insights.
          </p>
        </div>
      </section>

      <!-- 認証状態表示 -->
      <section v-if="isLoggedIn" class="bg-white rounded-lg shadow-lg p-6 text-center">
        <h3 class="text-xl font-semibold mb-4">Welcome back, {{ user?.name }}!</h3>
        <p class="text-gray-600 mb-4">
          You're signed in and ready to track your repositories.
        </p>
        <div class="flex justify-center space-x-4">
          <NuxtLink
            to="/dashboard"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Dashboard
          </NuxtLink>
          <button
            @click="logout"
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const { user, isLoggedIn, login, logout } = useAuth()

// メタ情報
useHead({
  title: 'Chase Light - GitHub Repository Activity Tracker',
  meta: [
    {
      name: 'description',
      content: 'Track GitHub repository activity, get notifications, and analyze trends with Chase Light.'
    }
  ]
})
</script>