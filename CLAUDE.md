# 参考ドキュメント

必要に応じて以下のファイルを参照してください。

- Task Master の開発ワークフローや全体的な流れを知りたい場合

  - .github/instructions/rules/dev_workflow.instructions.md

- Markdown ルールやルールファイルの書き方・記法例

  - .github/instructions/rules/roo_rules.instructions.md

- コードパターンやルールの継続的改善、ルール追加・更新の基準

  - .github/instructions/rules/self_improve.instructions.md

- Taskmaster ツールや CLI コマンドの詳細リファレンス、初期化・PRD パース・AI モデル設定など

  - .github/instructions/rules/taskmaster.instructions.md

- 各種モードの役割・行動指針（状況に応じて以下を参照してください）
  - 設計やアーキテクチャの検討・計画を行うとき
    - .github/instructions/rules-architect/architect-rules.instructions.md
  - 技術的な質問や情報収集、説明が必要なとき
    - .github/instructions/rules-ask/ask-rules.instructions.md
  - 複雑なタスクの分解やワークフロー全体の調整・進行管理を行うとき
    - .github/instructions/rules-boomerang/boomerang-rules.instructions.md
  - 実装やコマンド実行など、具体的な作業・コード変更を行うとき
    - .github/instructions/rules-code/code-rules.instructions.md
  - バグ調査や原因分析など、デバッグ作業を行うとき
    - .github/instructions/rules-debug/debug-rules.instructions.md
  - テストの実行やテスト関連の作業を行うとき
    - .github/instructions/rules-test/test-rules.instructions.md

# Git コミット時の注意点

GIT_COMMIT_AUTHOR_NAME, GIT_COMMIT_AUTHOR_EMAIL, GIT_COMMIT_COMMITTER_NAME, GIT_COMMIT_COMMITTER_EMAIL を Claude Code としてコミットしてください。
また、日本語でコミットメッセージを書いてください。
