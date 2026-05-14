# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building..."
	
	
	@go build -o main.exe cmd/api/main.go

# Run the application
run:
	@go run cmd/api/main.go
# Create DB container
docker-run:
	@docker compose up --build

# Shutdown DB container
docker-down:
	@docker compose down

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v
# Integrations Tests for the application
itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@powershell -ExecutionPolicy Bypass -Command "if (Get-Command air -ErrorAction SilentlyContinue) { \
		air; \
		Write-Output 'Watching...'; \
	} else { \
		Write-Output 'Installing air...'; \
		go install github.com/air-verse/air@latest; \
		air; \
		Write-Output 'Watching...'; \
	}"

# Seed initial data (one-time, skips if rows exist)
seed:
	@echo "Seeding..."
	@go run cmd/seed/main.go

# Refresh weekly incident reports (safe to run on a schedule)
refresh:
	@echo "Refreshing weekly reports..."
	@go run cmd/refresh/main.go

# Generate Swagger docs
swagger:
	@echo "Generating Swagger docs..."
	@swag init -g cmd/api/main.go --parseDependency --parseInternal

.PHONY: all build run test clean watch docker-run docker-down itest swagger seed refresh
