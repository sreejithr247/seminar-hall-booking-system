package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func exec(ctx context.Context, pool *pgxpool.Pool, query string, args ...any) {
	_, err := pool.Exec(ctx, query, args...)
	if err != nil {
		fmt.Printf("  ⚠ (non-fatal): %v\n", err)
	}
}

func main() {
	godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:Sree@1234@localhost:5432/shbsdb?sslmode=disable&search_path=shbs"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	defer pool.Close()

	ctx := context.Background()

	fmt.Println("Creating ENUM types...")
	exec(ctx, pool, `CREATE TYPE USER_ROLE AS ENUM ('admin','dept_coordinator','requester','faculty')`)
	exec(ctx, pool, `CREATE TYPE APPROVAL_STATUS AS ENUM ('pending','forwarded','approved','rejected','amended')`)
	exec(ctx, pool, `CREATE TYPE BOOKING_STATUS AS ENUM ('confirmed','cancelled','completed','no_show')`)
	exec(ctx, pool, `CREATE TYPE REQUESTER_TYPE AS ENUM ('class','club')`)

	fmt.Println("Creating tables...")
	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS departments (
		dept_id   SERIAL PRIMARY KEY,
		dept_name VARCHAR(100) NOT NULL UNIQUE,
		dept_code VARCHAR(10)  UNIQUE,
		created_at TIMESTAMPTZ DEFAULT NOW()
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS classes (
		class_id   SERIAL PRIMARY KEY,
		class_name VARCHAR(100) NOT NULL,
		dept_id    INTEGER NOT NULL REFERENCES departments(dept_id),
		year       VARCHAR(10)
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS clubs (
		club_id     SERIAL PRIMARY KEY,
		club_name   VARCHAR(100) NOT NULL UNIQUE,
		dept_id     INTEGER REFERENCES departments(dept_id),
		description TEXT
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS halls (
		hall_id    SERIAL PRIMARY KEY,
		hall_name  VARCHAR(100) NOT NULL UNIQUE,
		capacity   INTEGER NOT NULL,
		location   VARCHAR(200),
		facilities JSONB DEFAULT '{}',
		is_active  BOOLEAN DEFAULT true
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS users (
		user_id       SERIAL PRIMARY KEY,
		username      VARCHAR(50) NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		full_name     VARCHAR(150) NOT NULL,
		email         VARCHAR(150) UNIQUE,
		phone         VARCHAR(20),
		role          USER_ROLE NOT NULL,
		dept_id       INTEGER REFERENCES departments(dept_id),
		is_active     BOOLEAN DEFAULT true,
		created_at    TIMESTAMPTZ DEFAULT NOW(),
		updated_at    TIMESTAMPTZ DEFAULT NOW()
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS requesters (
		requester_id   SERIAL PRIMARY KEY,
		user_id        INTEGER NOT NULL UNIQUE REFERENCES users(user_id),
		requester_type REQUESTER_TYPE NOT NULL,
		class_id       INTEGER REFERENCES classes(class_id),
		club_id        INTEGER REFERENCES clubs(club_id),
		created_at     TIMESTAMPTZ DEFAULT NOW()
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS requests (
		request_id         SERIAL PRIMARY KEY,
		requester_id       INTEGER NOT NULL REFERENCES requesters(requester_id),
		hall_id            INTEGER NOT NULL REFERENCES halls(hall_id),
		event_title        VARCHAR(200) NOT NULL,
		event_description  TEXT,
		event_date         DATE NOT NULL,
		start_time         TIME NOT NULL,
		end_time           TIME NOT NULL,
		expected_attendees INTEGER,
		purpose            VARCHAR(200),
		dept_status        APPROVAL_STATUS DEFAULT 'pending',
		dept_approved_by   INTEGER REFERENCES users(user_id),
		dept_approved_at   TIMESTAMPTZ,
		dept_remarks       TEXT,
		admin_status       APPROVAL_STATUS DEFAULT 'pending',
		admin_approved_by  INTEGER REFERENCES users(user_id),
		admin_approved_at  TIMESTAMPTZ,
		admin_remarks      TEXT,
		requested_at       TIMESTAMPTZ DEFAULT NOW(),
		is_cancelled       BOOLEAN DEFAULT false
	)`)

	exec(ctx, pool, `CREATE TABLE IF NOT EXISTS bookings (
		booking_id   SERIAL PRIMARY KEY,
		request_id   INTEGER NOT NULL REFERENCES requests(request_id),
		hall_id      INTEGER NOT NULL REFERENCES halls(hall_id),
		requester_id INTEGER NOT NULL REFERENCES requesters(requester_id),
		event_title  VARCHAR(200) NOT NULL,
		event_date   DATE NOT NULL,
		start_time   TIME NOT NULL,
		end_time     TIME NOT NULL,
		status       BOOKING_STATUS DEFAULT 'confirmed',
		created_at   TIMESTAMPTZ DEFAULT NOW(),
		completed_at TIMESTAMPTZ
	)`)

	// Overlap trigger
	exec(ctx, pool, `CREATE OR REPLACE FUNCTION check_booking_overlap() RETURNS TRIGGER AS $$
	BEGIN
		IF EXISTS (
			SELECT 1 FROM bookings
			WHERE hall_id = NEW.hall_id
			  AND event_date = NEW.event_date
			  AND status = 'confirmed'
			  AND booking_id != COALESCE(NEW.booking_id, 0)
			  AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
		) THEN
			RAISE EXCEPTION 'Time slot overlaps with an existing booking for this hall on this date';
		END IF;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql`)

	exec(ctx, pool, `DROP TRIGGER IF EXISTS trg_booking_overlap ON bookings`)
	exec(ctx, pool, `CREATE TRIGGER trg_booking_overlap
		BEFORE INSERT OR UPDATE ON bookings
		FOR EACH ROW EXECUTE FUNCTION check_booking_overlap()`)

	fmt.Println("Seeding data...")

	// Department
	var deptID int
	pool.QueryRow(ctx, `INSERT INTO departments (dept_name, dept_code) VALUES ('Computer Science', 'CS')
		ON CONFLICT (dept_name) DO UPDATE SET dept_name=departments.dept_name RETURNING dept_id`).Scan(&deptID)
	if deptID == 0 {
		pool.QueryRow(ctx, `SELECT dept_id FROM departments WHERE dept_code='CS'`).Scan(&deptID)
	}
	fmt.Printf("  Dept ID: %d\n", deptID)

	// Class
	var classID int
	pool.QueryRow(ctx, `INSERT INTO classes (class_name, dept_id, year) VALUES ('BCA 6th Sem', $1, '3rd Year')
		ON CONFLICT DO NOTHING RETURNING class_id`, deptID).Scan(&classID)
	if classID == 0 {
		pool.QueryRow(ctx, `SELECT class_id FROM classes WHERE dept_id=$1 LIMIT 1`, deptID).Scan(&classID)
	}

	// Halls
	halls := []struct{ name, loc string; cap int }{
		{"Main Seminar Hall", "Block A, Ground Floor", 200},
		{"Conference Room 1", "Block B, 1st Floor", 50},
		{"Mini Auditorium", "Block C, Ground Floor", 100},
	}
	for _, h := range halls {
		exec(ctx, pool, `INSERT INTO halls (hall_name, capacity, location) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
			h.name, h.cap, h.loc)
	}
	fmt.Println("  ✅ Halls inserted")

	// Users
	type userSeed struct{ username, password, full_name, email, role string; deptID *int }
	users := []userSeed{
		{"admin", "admin123", "System Administrator", "admin@shbs.com", "admin", nil},
		{"coordinator1", "coord123", "CS Dept Coordinator", "coord@shbs.com", "dept_coordinator", &deptID},
		{"student1", "req123", "Test Student", "student@shbs.com", "requester", &deptID},
	}

	var studentUserID int
	for _, u := range users {
		hash, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		var uid int
		err := pool.QueryRow(ctx, `
			INSERT INTO users (username, password_hash, full_name, email, role, dept_id, is_active)
			VALUES ($1, $2, $3, $4, $5::USER_ROLE, $6, true)
			ON CONFLICT (username) DO UPDATE SET password_hash=$2, role=$5::USER_ROLE, is_active=true
			RETURNING user_id`, u.username, string(hash), u.full_name, u.email, u.role, u.deptID).Scan(&uid)
		if err != nil {
			fmt.Printf("  ⚠ User %s: %v\n", u.username, err)
		} else {
			fmt.Printf("  ✅ User: %s / %s (id=%d)\n", u.username, u.password, uid)
			if u.username == "student1" {
				studentUserID = uid
			}
		}
	}

	// Register student as requester
	if studentUserID > 0 && classID > 0 {
		exec(ctx, pool, `INSERT INTO requesters (user_id, requester_type, class_id) VALUES ($1, 'class', $2) ON CONFLICT (user_id) DO NOTHING`,
			studentUserID, classID)
		fmt.Println("  ✅ student1 registered as requester")
	}

	fmt.Println("\n✅ Done! Login credentials:")
	fmt.Println("  Admin:       admin / admin123")
	fmt.Println("  Coordinator: coordinator1 / coord123")
	fmt.Println("  Student:     student1 / req123")
}
