<template>
  <div class="from-blue-50 to-indigo-100 min-h-screen bg-gradient-to-br">
    <div class="container mx-auto px-4 py-16">
      <!-- ヘッダー -->
      <header class="mb-16 text-center">
        <h1 class="text-5xl text-gray-900 mb-4 font-bold">Chase Light</h1>
        <p class="text-xl text-gray-600 mb-8">
          GitHub Repository Activity Tracker
        </p>
        <div class="flex justify-center space-x-4">
          <button
            v-if="!isLoggedIn"
            class="bg-blue-600 text-white hover:bg-blue-700 transform rounded-lg
              px-6 py-3 font-bold transition duration-300 ease-in-out
              hover:scale-105"
            @click="login"
          >
            Login with GitHub
          </button>
          <NuxtLink
            v-else
            to="/dashboard"
            class="bg-green-600 text-white hover:bg-green-700 transform
              rounded-lg px-6 py-3 font-bold transition duration-300 ease-in-out
              hover:scale-105"
          >
            Go to Dashboard
          </NuxtLink>
        </div>
      </header>

      <!-- 機能説明 -->
      <section class="mb-16 grid gap-8 md:grid-cols-3">
        <div class="bg-white rounded-lg p-6 text-center shadow-lg">
          <div class="text-4xl mb-4">👀</div>
          <h3 class="text-xl mb-2 font-semibold">Repository Monitoring</h3>
          <p class="text-gray-600">
            Track activity across your favorite GitHub repositories in
            real-time.
          </p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-lg">
          <div class="text-4xl mb-4">🔔</div>
          <h3 class="text-xl mb-2 font-semibold">Smart Notifications</h3>
          <p class="text-gray-600">
            Get notified about important events like releases, issues, and pull
            requests.
          </p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-lg">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-xl mb-2 font-semibold">Analytics Dashboard</h3>
          <p class="text-gray-600">
            Visualize repository trends and activity patterns with detailed
            insights.
          </p>
        </div>
      </section>

      <!-- 認証状態表示 -->
      <section
        v-if="isLoggedIn"
        class="bg-white rounded-lg p-6 text-center shadow-lg"
      >
        <h3 class="text-xl mb-4 font-semibold">
          Welcome back, {{ user?.name }}!
        </h3>
        <p class="text-gray-600 mb-4">
          You're signed in and ready to track your repositories.
        </p>
        <div class="flex justify-center space-x-4">
          <NuxtLink
            to="/dashboard"
            class="rounded bg-blue-600 text-white hover:bg-blue-700 px-4 py-2
              font-bold"
          >
            Dashboard
          </NuxtLink>
          <button
            class="rounded bg-gray-600 text-white hover:bg-gray-700 px-4 py-2
              font-bold"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// ゲストレイアウトを使用
definePageMeta({
  layout: 'guest',
})

const { user, isLoggedIn, login, logout } = useAuth()

// メタ情報
useHead({
  title: 'Chase Light - GitHub Repository Activity Tracker',
  meta: [
    {
      name: 'description',
      content:
        'Track GitHub repository activity, get notifications, and analyze trends with Chase Light.',
    },
  ],
})
</script>
