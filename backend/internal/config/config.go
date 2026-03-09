package config

import (
	"os"
)

type Config struct {
	DatabaseURL  string
	JWTSecret    string
	Environment  string
	FrontendURL  string
	Port         string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://localhost:5432/seminar_hall_db?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Environment:  getEnv("ENVIRONMENT", "development"),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
		Port:         getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

