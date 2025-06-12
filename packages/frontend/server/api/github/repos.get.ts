export default defineEventHandler(async (event) => {
  // セッション認証を要求
  const session = await requireUserSession(event);

  if (!session.accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No access token available',
    });
  }

  const query = getQuery(event);
  const { owner, repo, page = 1, per_page = 30 } = query;

  try {
    let url = 'https://api.github.com';

    if (owner && repo) {
      // 特定のリポジトリ情報を取得
      url += `/repos/${owner}/${repo}`;
    } else if (owner) {
      // 特定ユーザーのリポジトリ一覧を取得
      url += `/users/${owner}/repos?page=${page}&per_page=${per_page}&sort=updated`;
    } else {
      // 認証ユーザーのリポジトリ一覧を取得
      url += `/user/repos?page=${page}&per_page=${per_page}&sort=updated`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'chase-light2-app',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `GitHub API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    return {
      success: true,
      data,
      pagination: {
        page: parseInt(`${page}`),
        per_page: parseInt(`${per_page}`),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('GitHub repos API proxy error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch GitHub repository data: ${errorMessage}`,
    });
  }
});
