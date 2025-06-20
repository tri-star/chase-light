---
applyTo: "**"
---

# Git コミット時の注意点

- コミットメッセージは日本語でお願いします。
- GIT_COMMIT_AUTHOR_NAME, GIT_COMMIT_AUTHOR_EMAIL, GIT_COMMIT_COMMITTER_NAME, GIT_COMMIT_COMMITTER_EMAIL を GitHub Copilotの名前、Eメール に設定してコミットしてください。
- コミットメッセージの末尾などに、どのモデルを利用したかを書いてください。
- コミット前に以下を実行し、エラーがある場合は調査、修正案を検討し、修正を行ってください。
  - pnpm format
  - pnpm lint
  - pnpm test
