<template>
  <div class="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
    <h2 class="text-2xl font-bold text-center">Auth0 認証デモ</h2>
    
    <div v-if="isLoading" class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p class="mt-2">読み込み中...</p>
    </div>
    
    <div v-else-if="isAuthenticated" class="space-y-4">
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p class="font-semibold">ログイン済み</p>
        <p class="text-sm">ようこそ、{{ user?.name || user?.email }}さん！</p>
      </div>
      
      <div v-if="user" class="bg-gray-50 p-4 rounded">
        <h3 class="font-semibold mb-2">ユーザー情報:</h3>
        <div class="text-sm space-y-1">
          <p><strong>名前:</strong> {{ user.name }}</p>
          <p><strong>メール:</strong> {{ user.email }}</p>
          <p><strong>画像:</strong></p>
          <img v-if="user.picture" :src="user.picture" :alt="user.name" class="w-16 h-16 rounded-full">
        </div>
      </div>
      
      <button 
        @click="logout"
        class="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        ログアウト
      </button>
    </div>
    
    <div v-else class="text-center">
      <p class="mb-4">認証が必要です</p>
      <button 
        @click="login"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        GitHubでログイン
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated, isLoading, login, logout } = useAuth()
</script>