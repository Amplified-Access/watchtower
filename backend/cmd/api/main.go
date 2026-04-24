// Package main is the entry point for the Watchtower API.
//
//	@title			Watchtower API
//	@version		1.0
//	@description	Amplified Access Watchtower — incident reporting and monitoring platform API.
//
//	@contact.name	Amplified Access
//
//	@host		localhost:8080
//	@BasePath	/api/v1
//
//	@securityDefinitions.apikey	BearerAuth
//	@in							header
//	@name						Authorization
//	@description				Bearer token obtained from authentication. Format: "Bearer <token>"
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "backend/docs"
	"backend/internal/server"
	"backend/internal/bootstrap"
)

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	<-ctx.Done()

	fmt.Println()
	fmt.Println("  ♻️   Shutting down gracefully...")
	stop()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := apiServer.Shutdown(ctx); err != nil {
		fmt.Printf("  ❌  Forced shutdown: %v\n", err)
	}

	fmt.Println("  ✅  Shutdown complete")
	done <- true
}

func main() {
	svc := bootstrap.Run()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("  ♻️   Starting HTTP server on :%s...\n", port)
	srv := server.NewServer(svc.DB, svc.Redis)

	done := make(chan bool, 1)
	go gracefulShutdown(srv, done)

	fmt.Printf("  ✅  Server started on :%s\n", port)
	fmt.Println()
	fmt.Println("  🚀  Watchtower is live — press Ctrl+C to stop")
	fmt.Println()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("  ❌  Server error: %s\n", err)
		os.Exit(1)
	}

	<-done
}
