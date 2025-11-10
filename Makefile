.PHONY: help
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(BLUE)DryORM Development Commands$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ''

# ==================== Frontend ====================

frontend-install: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install

frontend-build: ## Build frontend assets for production
	@echo "$(BLUE)Building frontend assets...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend built successfully$(NC)"

frontend-watch: ## Watch frontend files and rebuild on changes
	@echo "$(BLUE)Starting frontend watch mode...$(NC)"
	cd frontend && npm run dev

frontend-clean: ## Remove frontend build artifacts and node_modules
	@echo "$(YELLOW)Cleaning frontend build artifacts...$(NC)"
	rm -rf frontend/node_modules
	rm -rf backend/dryorm/static/dist/*
	@echo "$(GREEN)✓ Frontend cleaned$(NC)"

clean: frontend-clean ## Clean all build artifacts
	@echo "$(YELLOW)Cleaning Python cache...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

# ==================== Docker ====================

build-executors: ## Build all executor images using multi-stage Dockerfile
	@echo "$(BLUE)Building all Django executor images from multi-stage Dockerfile...$(NC)"
	docker-compose build executor-python-django-postgres-4.2.26 executor-python-django-postgres-5.2.8
	docker-compose build executor-python-django-mariadb-4.2.26 executor-python-django-mariadb-5.2.8
	@echo "$(GREEN)✓ All executor images built successfully$(NC)"

.PHONY: frontend-install frontend-build frontend-watch frontend-clean
.PHONY: up down restart logs logs-backend logs-worker ps build-docker build-executors
.PHONY: shell dbshell makemigrations migrate createsuperuser collectstatic
.PHONY: dev dev-watch setup clean clean-all test test-coverage check requirements
