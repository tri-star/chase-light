.PHONY: build-OtlpLayer

build-OtlpLayer:
	# SAM が設定する ARTIFACTS_DIR に Layer の成果物を作ります
	# Lambda Layer の Node.js 依存は nodejs/node_modules に入る必要があります
	rm -rf "$(ARTIFACTS_DIR)/nodejs"
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp -a nodejs/. "$(ARTIFACTS_DIR)/nodejs/"
	# 既存 node_modules が混ざらないように削除してから再インストール
	rm -rf "$(ARTIFACTS_DIR)/nodejs/node_modules"
	cd "$(ARTIFACTS_DIR)/nodejs" && npm ci --omit=dev
