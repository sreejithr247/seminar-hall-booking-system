package main

import (
	"log"
	"os"

	"seminar-hall-booking-system/internal/config"
	"seminar-hall-booking-system/internal/database"
	"seminar-hall-booking-system/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables (.env only — not .env.production; that file is for deploy docs / hosts)
	_ = godotenv.Load(".env")
	_ = godotenv.Overload(".env.local")

	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	db, err := database.NewConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize router
	r := router.SetupRouter(db, cfg)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
