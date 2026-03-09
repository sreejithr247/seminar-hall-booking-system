package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:Sree@1234@localhost:5432/shbsdb?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	defer pool.Close()

	schema, err := os.ReadFile(`D:\Seminar Hall Booking System\DB\Tables.sql`)
	if err != nil {
		log.Fatal("Could not read Tables.sql:", err)
	}

	_, err = pool.Exec(context.Background(), string(schema))
	if err != nil {
		// Some errors are expected if types/tables already exist
		fmt.Println("Schema execution result (errors may be expected for existing objects):", err)
	} else {
		fmt.Println("✅ Schema applied successfully!")
	}
}
