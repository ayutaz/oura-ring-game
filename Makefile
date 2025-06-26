# Oura Quest プロトタイプ用 Makefile

.PHONY: help
help:
	@echo "Oura Quest Development Commands"
	@echo "=============================="
	@echo "setup          - 初期セットアップ"
	@echo "start          - Docker環境を起動"
	@echo "stop           - Docker環境を停止"
	@echo "restart        - Docker環境を再起動"
	@echo "logs           - ログを表示"
	@echo "test           - テストを実行"
	@echo "clean          - Docker環境をクリーンアップ"
	@echo "db-migrate     - データベースマイグレーション実行"
	@echo "db-seed        - テストデータ投入"

.PHONY: setup
setup:
	@echo "🚀 初期セットアップを開始します..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ .envファイルを作成しました。必要な環境変数を設定してください。"; \
	fi
	@mkdir -p apps/web apps/api
	@echo "✅ ディレクトリ構造を作成しました"
	@docker-compose build
	@echo "✅ Dockerイメージをビルドしました"
	@echo "🎉 セットアップ完了！'make start' で開発環境を起動してください"

.PHONY: start
start:
	@echo "🚀 開発環境を起動します..."
	@docker-compose up -d
	@echo "✅ 起動完了！"
	@echo "📱 Web: http://localhost:3000"
	@echo "🔧 API: http://localhost:8787"
	@echo "💾 pgAdmin: http://localhost:5050"

.PHONY: stop
stop:
	@echo "🛑 開発環境を停止します..."
	@docker-compose down
	@echo "✅ 停止完了！"

.PHONY: restart
restart: stop start

.PHONY: logs
logs:
	@docker-compose logs -f

.PHONY: logs-web
logs-web:
	@docker-compose logs -f web

.PHONY: logs-api
logs-api:
	@docker-compose logs -f api

.PHONY: test
test:
	@echo "🧪 テストを実行します..."
	@npm test

.PHONY: clean
clean:
	@echo "🧹 クリーンアップを実行します..."
	@docker-compose down -v
	@docker system prune -f
	@echo "✅ クリーンアップ完了！"

.PHONY: db-migrate
db-migrate:
	@echo "📊 データベースマイグレーションを実行します..."
	@docker-compose exec db psql -U oura -d oura_quest -f /docker-entrypoint-initdb.d/init.sql
	@echo "✅ マイグレーション完了！"

.PHONY: db-seed
db-seed:
	@echo "🌱 テストデータを投入します..."
	@docker-compose exec db psql -U oura -d oura_quest -c "\
		INSERT INTO users (email, oura_user_id) VALUES ('test@example.com', 'test-oura-id') ON CONFLICT DO NOTHING; \
		INSERT INTO characters (user_id, name, level, experience) \
		SELECT id, 'テスト勇者', 5, 1250 FROM users WHERE email = 'test@example.com' \
		ON CONFLICT DO NOTHING;"
	@echo "✅ テストデータ投入完了！"

.PHONY: db-console
db-console:
	@docker-compose exec db psql -U oura -d oura_quest

.PHONY: web-shell
web-shell:
	@docker-compose exec web sh

.PHONY: api-shell
api-shell:
	@docker-compose exec api sh