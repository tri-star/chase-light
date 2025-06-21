import type {
  Repository,
  RepositoryOwner,
  License,
} from "../../schemas/repository.schema"
import type { Release, ReleaseAsset } from "../../schemas/release.schema"
import type {
  PullRequest,
  PullRequestBranch,
} from "../../schemas/pull-request.schema"
import type { Issue, Label, Milestone } from "../../schemas/issue.schema"

/**
 * Test Data Builder
 *
 * テスト用データの生成を支援するビルダークラス
 * 標準的なテストデータを簡単に作成できる
 */
export class TestDataBuilder {
  /**
   * Repository 作成
   */
  static createRepository(overrides: Partial<Repository> = {}): Repository {
    return {
      id: 1,
      name: "test-repo",
      fullName: "testuser/test-repo",
      description: "A test repository for unit testing",
      htmlUrl: "https://github.com/testuser/test-repo",
      cloneUrl: "https://github.com/testuser/test-repo.git",
      stargazersCount: 100,
      watchersCount: 50,
      forksCount: 25,
      language: "TypeScript",
      topics: ["typescript", "testing", "github-api"],
      isPrivate: false,
      isFork: false,
      isArchived: false,
      defaultBranch: "main",
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      pushedAt: "2024-01-01T12:00:00Z",
      owner: this.createRepositoryOwner(),
      license: this.createLicense(),
      ...overrides,
    }
  }

  /**
   * Repository Owner 作成
   */
  static createRepositoryOwner(
    overrides: Partial<RepositoryOwner> = {},
  ): RepositoryOwner {
    return {
      login: "testuser",
      id: 12345,
      avatarUrl: "https://github.com/images/error/testuser_happy.gif",
      htmlUrl: "https://github.com/testuser",
      type: "User",
      ...overrides,
    }
  }

  /**
   * License 作成
   */
  static createLicense(overrides: Partial<License> = {}): License {
    return {
      key: "mit",
      name: "MIT License",
      spdxId: "MIT",
      url: "https://api.github.com/licenses/mit",
      ...overrides,
    }
  }

  /**
   * Release 作成
   */
  static createRelease(overrides: Partial<Release> = {}): Release {
    return {
      id: 1001,
      tagName: "v1.0.0",
      name: "Release v1.0.0",
      body: "## What's Changed\n\n- Initial release\n- Added core features\n- Bug fixes",
      isDraft: false,
      isPrerelease: false,
      createdAt: "2024-01-01T00:00:00Z",
      publishedAt: "2024-01-01T00:00:00Z",
      htmlUrl: "https://github.com/testuser/test-repo/releases/tag/v1.0.0",
      tarballUrl:
        "https://api.github.com/repos/testuser/test-repo/tarball/v1.0.0",
      zipballUrl:
        "https://api.github.com/repos/testuser/test-repo/zipball/v1.0.0",
      author: this.createRepositoryOwner(),
      assets: [this.createReleaseAsset()],
      ...overrides,
    }
  }

  /**
   * Release Asset 作成
   */
  static createReleaseAsset(
    overrides: Partial<ReleaseAsset> = {},
  ): ReleaseAsset {
    return {
      id: 2001,
      name: "release-binary.tar.gz",
      label: "Binary distribution",
      contentType: "application/gzip",
      size: 1024000,
      downloadCount: 150,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      browserDownloadUrl:
        "https://github.com/testuser/test-repo/releases/download/v1.0.0/release-binary.tar.gz",
      ...overrides,
    }
  }

  /**
   * Pull Request 作成
   */
  static createPullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
    return {
      id: 3001,
      number: 1,
      title: "Add new feature",
      body: "This PR adds a new exciting feature.\n\n- Feature implementation\n- Tests added\n- Documentation updated",
      state: "open",
      isDraft: false,
      isMerged: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
      closedAt: null,
      mergedAt: null,
      htmlUrl: "https://github.com/testuser/test-repo/pull/1",
      head: this.createPullRequestBranch({ ref: "feature-branch" }),
      base: this.createPullRequestBranch({ ref: "main" }),
      user: this.createRepositoryOwner(),
      assignees: [this.createRepositoryOwner({ login: "reviewer1" })],
      reviewers: [this.createRepositoryOwner({ login: "reviewer2" })],
      labels: [this.createLabel()],
      ...overrides,
    }
  }

  /**
   * Pull Request Branch 作成
   */
  static createPullRequestBranch(
    overrides: Partial<PullRequestBranch> = {},
  ): PullRequestBranch {
    return {
      ref: "main",
      sha: "abcd1234567890abcd1234567890abcd12345678",
      label: "testuser:main",
      repo: this.createRepository(),
      ...overrides,
    }
  }

  /**
   * Issue 作成
   */
  static createIssue(overrides: Partial<Issue> = {}): Issue {
    return {
      id: 4001,
      number: 1,
      title: "Bug: Application crashes on startup",
      body: "Description of the bug:\n\n1. Start the application\n2. See error\n\nExpected: Application starts normally\nActual: Application crashes",
      state: "open",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T06:00:00Z",
      closedAt: null,
      htmlUrl: "https://github.com/testuser/test-repo/issues/1",
      user: this.createRepositoryOwner(),
      assignees: [this.createRepositoryOwner({ login: "assignee1" })],
      labels: [this.createLabel({ name: "bug", color: "d73a4a" })],
      milestone: this.createMilestone(),
      comments: 3,
      isPullRequest: false,
      ...overrides,
    }
  }

  /**
   * Label 作成
   */
  static createLabel(overrides: Partial<Label> = {}): Label {
    return {
      id: 5001,
      name: "enhancement",
      description: "New feature or request",
      color: "a2eeef",
      ...overrides,
    }
  }

  /**
   * Milestone 作成
   */
  static createMilestone(overrides: Partial<Milestone> = {}): Milestone {
    return {
      id: 6001,
      number: 1,
      title: "v1.0.0 Release",
      description: "First major release milestone",
      state: "open",
      createdAt: "2023-12-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      dueOn: "2024-02-01T00:00:00Z",
      closedAt: null,
      ...overrides,
    }
  }

  /**
   * Repository リスト作成
   */
  static createRepositoryList(
    count: number = 3,
    baseOverrides: Partial<Repository> = {},
  ): Repository[] {
    return Array.from({ length: count }, (_, i) =>
      this.createRepository({
        id: i + 1,
        name: `repo-${i + 1}`,
        fullName: `testuser/repo-${i + 1}`,
        description: `Test repository ${i + 1}`,
        htmlUrl: `https://github.com/testuser/repo-${i + 1}`,
        cloneUrl: `https://github.com/testuser/repo-${i + 1}.git`,
        stargazersCount: 100 + i * 10,
        ...baseOverrides,
      }),
    )
  }

  /**
   * Release リスト作成
   */
  static createReleaseList(
    count: number = 2,
    baseOverrides: Partial<Release> = {},
  ): Release[] {
    return Array.from({ length: count }, (_, i) =>
      this.createRelease({
        id: 1001 + i,
        tagName: `v1.${i}.0`,
        name: `Release v1.${i}.0`,
        htmlUrl: `https://github.com/testuser/test-repo/releases/tag/v1.${i}.0`,
        createdAt: `2024-0${i + 1}-01T00:00:00Z`,
        publishedAt: `2024-0${i + 1}-01T00:00:00Z`,
        ...baseOverrides,
      }),
    )
  }

  /**
   * Pull Request リスト作成
   */
  static createPullRequestList(
    count: number = 2,
    baseOverrides: Partial<PullRequest> = {},
  ): PullRequest[] {
    return Array.from({ length: count }, (_, i) =>
      this.createPullRequest({
        id: 3001 + i,
        number: i + 1,
        title: `Pull Request ${i + 1}`,
        htmlUrl: `https://github.com/testuser/test-repo/pull/${i + 1}`,
        head: this.createPullRequestBranch({ ref: `feature-${i + 1}` }),
        ...baseOverrides,
      }),
    )
  }

  /**
   * Issue リスト作成
   */
  static createIssueList(
    count: number = 2,
    baseOverrides: Partial<Issue> = {},
  ): Issue[] {
    return Array.from({ length: count }, (_, i) =>
      this.createIssue({
        id: 4001 + i,
        number: i + 1,
        title: `Issue ${i + 1}`,
        htmlUrl: `https://github.com/testuser/test-repo/issues/${i + 1}`,
        ...baseOverrides,
      }),
    )
  }

  /**
   * エラー用のRepository（不正なデータ）
   */
  static createInvalidRepository(): Repository {
    return this.createRepository({
      id: -1,
      name: "",
      fullName: "",
      description: null,
      htmlUrl: "",
      cloneUrl: "",
      stargazersCount: -1,
      watchersCount: -1,
      forksCount: -1,
      language: null,
      topics: [],
      defaultBranch: "",
      createdAt: "",
      updatedAt: "",
      pushedAt: null,
    })
  }

  /**
   * 大容量データの生成（パフォーマンステスト用）
   */
  static createLargeRepositoryList(count: number = 1000): Repository[] {
    return this.createRepositoryList(count)
  }

  /**
   * 多様なstateのPull Request作成
   */
  static createMixedStatePullRequests(): PullRequest[] {
    return [
      this.createPullRequest({ state: "open", title: "Open PR" }),
      this.createPullRequest({
        state: "closed",
        isMerged: true,
        title: "Merged PR",
      }),
      this.createPullRequest({
        state: "closed",
        isMerged: false,
        title: "Closed PR",
      }),
    ]
  }

  /**
   * 多様なstateのIssue作成
   */
  static createMixedStateIssues(): Issue[] {
    return [
      this.createIssue({ state: "open", title: "Open Issue" }),
      this.createIssue({
        state: "closed",
        title: "Closed Issue",
        closedAt: "2024-01-01T12:00:00Z",
      }),
    ]
  }
}
