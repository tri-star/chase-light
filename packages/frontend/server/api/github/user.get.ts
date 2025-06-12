export default defineEventHandler(async (event) => {
  // セッション認証を要求
  const session = await requireUserSession(event)
  
  if (!session.accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No access token available'
    })
  }

  try {
    // GitHub APIにプロキシリクエスト
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'chase-light2-app'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `GitHub API error: ${response.statusText}`
      })
    }

    const userData = await response.json()
    
    return {
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('GitHub API proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch GitHub user data: ${error.message}`
    })
  }
})