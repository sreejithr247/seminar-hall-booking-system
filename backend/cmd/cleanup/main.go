package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func exec(ctx context.Context, pool *pgxpool.Pool, query string) {
	_, err := pool.Exec(ctx, query)
	if err != nil {
		fmt.Printf("  ⚠ (non-fatal): %v\n", err)
	} else {
		fmt.Printf("  ✅ %s\n", query)
	}
}

func main() {
	godotenv.Load()

	// Explicitly connect to PUBLIC schema for cleanup
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:Sree@1234@localhost:5432/shbsdb?sslmode=disable"
	}
	// Strip any search_path to target public
	dbURL = "postgresql://postgres:Sree@1234@localhost:5432/shbsdb?sslmode=disable&search_path=public"

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	defer pool.Close()

	ctx := context.Background()
	fmt.Println("Dropping public schema tables...")

	// Drop in reverse dependency order
	exec(ctx, pool, `DROP TABLE IF EXISTS public.bookings CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.requests CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.requesters CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.users CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.halls CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.clubs CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.classes CASCADE`)
	exec(ctx, pool, `DROP TABLE IF EXISTS public.departments CASCADE`)

	// Drop the trigger function if it ended up in public
	exec(ctx, pool, `DROP FUNCTION IF EXISTS public.check_booking_overlap CASCADE`)

	fmt.Println("\n✅ All public schema tables dropped. shbs schema is untouched.")
}
