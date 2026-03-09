package repositories

import (
	"context"
	"seminar-hall-booking-system/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ManagementRepository struct {
	db *pgxpool.Pool
}

func NewManagementRepository(db *pgxpool.Pool) *ManagementRepository {
	return &ManagementRepository{db: db}
}

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

func (r *ManagementRepository) GetAllDepartments(ctx context.Context) ([]models.Department, error) {
	rows, err := r.db.Query(ctx, `SELECT dept_id, dept_name, dept_code, created_at FROM departments ORDER BY dept_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var depts []models.Department
	for rows.Next() {
		var d models.Department
		if err := rows.Scan(&d.DeptID, &d.DeptName, &d.DeptCode, &d.CreatedAt); err != nil {
			return nil, err
		}
		depts = append(depts, d)
	}
	return depts, nil
}

func (r *ManagementRepository) CreateDepartment(ctx context.Context, name, code string) (*models.Department, error) {
	var dept models.Department
	err := r.db.QueryRow(ctx,
		`INSERT INTO departments (dept_name, dept_code) VALUES ($1, $2) RETURNING dept_id, dept_name, dept_code, created_at`,
		name, code,
	).Scan(&dept.DeptID, &dept.DeptName, &dept.DeptCode, &dept.CreatedAt)
	return &dept, err
}

func (r *ManagementRepository) UpdateDepartment(ctx context.Context, id int, name, code string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE departments SET dept_name = $1, dept_code = $2 WHERE dept_id = $3`,
		name, code, id,
	)
	return err
}

func (r *ManagementRepository) DeleteDepartment(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM departments WHERE dept_id = $1`, id)
	return err
}

// ─── HALLS ───────────────────────────────────────────────────────────────────

func (r *ManagementRepository) CreateHall(ctx context.Context, h *models.Hall) (*models.Hall, error) {
	err := r.db.QueryRow(ctx,
		`INSERT INTO halls (hall_name, capacity, location, facilities) VALUES ($1, $2, $3, $4)
		 RETURNING hall_id, hall_name, capacity, location, facilities, is_active`,
		h.HallName, h.Capacity, h.Location, h.Facilities,
	).Scan(&h.HallID, &h.HallName, &h.Capacity, &h.Location, &h.Facilities, &h.IsActive)
	return h, err
}

func (r *ManagementRepository) UpdateHall(ctx context.Context, id int, h *models.Hall) error {
	_, err := r.db.Exec(ctx,
		`UPDATE halls SET hall_name=$1, capacity=$2, location=$3, facilities=$4, is_active=$5 WHERE hall_id=$6`,
		h.HallName, h.Capacity, h.Location, h.Facilities, h.IsActive, id,
	)
	return err
}

func (r *ManagementRepository) DeleteHall(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `UPDATE halls SET is_active = false WHERE hall_id = $1`, id)
	return err
}

// ─── USERS ───────────────────────────────────────────────────────────────────

func (r *ManagementRepository) GetUsersByRole(ctx context.Context, role string) ([]models.User, error) {
	rows, err := r.db.Query(ctx,
		`SELECT user_id, username, password_hash, full_name, email, phone, role, dept_id, is_active, created_at, updated_at
		 FROM users WHERE role = $1 AND is_active = true ORDER BY full_name`,
		role,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.UserID, &u.Username, &u.PasswordHash, &u.FullName, &u.Email, &u.Phone, &u.Role, &u.DeptID, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *ManagementRepository) GetAllUsers(ctx context.Context) ([]models.User, error) {
	rows, err := r.db.Query(ctx,
		`SELECT user_id, username, password_hash, full_name, email, phone, role, dept_id, is_active, created_at, updated_at
		 FROM users WHERE is_active = true ORDER BY full_name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.UserID, &u.Username, &u.PasswordHash, &u.FullName, &u.Email, &u.Phone, &u.Role, &u.DeptID, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *ManagementRepository) DeactivateUser(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET is_active = false WHERE user_id = $1`, id)
	return err
}

// ─── CLASSES ─────────────────────────────────────────────────────────────────

func (r *ManagementRepository) GetClassesByDept(ctx context.Context, deptID int) ([]models.Class, error) {
	rows, err := r.db.Query(ctx,
		`SELECT class_id, class_name, dept_id, year FROM classes WHERE dept_id = $1 ORDER BY class_name`, deptID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []models.Class
	for rows.Next() {
		var c models.Class
		if err := rows.Scan(&c.ClassID, &c.ClassName, &c.DeptID, &c.Year); err != nil {
			return nil, err
		}
		classes = append(classes, c)
	}
	return classes, nil
}

func (r *ManagementRepository) CreateClass(ctx context.Context, name string, deptID int, year string) (*models.Class, error) {
	var c models.Class
	err := r.db.QueryRow(ctx,
		`INSERT INTO classes (class_name, dept_id, year) VALUES ($1, $2, $3) RETURNING class_id, class_name, dept_id, year`,
		name, deptID, year,
	).Scan(&c.ClassID, &c.ClassName, &c.DeptID, &c.Year)
	return &c, err
}

func (r *ManagementRepository) DeleteClass(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM classes WHERE class_id = $1`, id)
	return err
}

// ─── CLUBS ───────────────────────────────────────────────────────────────────

func (r *ManagementRepository) GetAllClubs(ctx context.Context) ([]models.Club, error) {
	rows, err := r.db.Query(ctx,
		`SELECT club_id, club_name, dept_id, description FROM clubs ORDER BY club_name`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clubs []models.Club
	for rows.Next() {
		var c models.Club
		if err := rows.Scan(&c.ClubID, &c.ClubName, &c.DeptID, &c.Description); err != nil {
			return nil, err
		}
		clubs = append(clubs, c)
	}
	return clubs, nil
}

func (r *ManagementRepository) CreateClub(ctx context.Context, name string, deptID *int, description *string) (*models.Club, error) {
	var c models.Club
	err := r.db.QueryRow(ctx,
		`INSERT INTO clubs (club_name, dept_id, description) VALUES ($1, $2, $3) RETURNING club_id, club_name, dept_id, description`,
		name, deptID, description,
	).Scan(&c.ClubID, &c.ClubName, &c.DeptID, &c.Description)
	return &c, err
}

func (r *ManagementRepository) DeleteClub(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM clubs WHERE club_id = $1`, id)
	return err
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

func (r *ManagementRepository) GetHallUsageReport(ctx context.Context) ([]models.HallUsageReport, error) {
	rows, err := r.db.Query(ctx, `
		SELECT h.hall_id, h.hall_name, COUNT(b.booking_id) AS total_bookings
		FROM halls h
		LEFT JOIN bookings b ON h.hall_id = b.hall_id AND b.status != 'cancelled'
		GROUP BY h.hall_id, h.hall_name
		ORDER BY total_bookings DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.HallUsageReport
	for rows.Next() {
		var rep models.HallUsageReport
		if err := rows.Scan(&rep.HallID, &rep.HallName, &rep.TotalBookings); err != nil {
			return nil, err
		}
		reports = append(reports, rep)
	}
	return reports, nil
}

func (r *ManagementRepository) GetDepartmentUsageReport(ctx context.Context) ([]models.DepartmentUsageReport, error) {
	rows, err := r.db.Query(ctx, `
		SELECT d.dept_id, d.dept_name, COUNT(r.request_id) AS total_requests
		FROM departments d
		LEFT JOIN users u ON u.dept_id = d.dept_id
		LEFT JOIN requesters req ON req.user_id = u.user_id
		LEFT JOIN requests r ON r.requester_id = req.requester_id
		GROUP BY d.dept_id, d.dept_name
		ORDER BY total_requests DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.DepartmentUsageReport
	for rows.Next() {
		var rep models.DepartmentUsageReport
		if err := rows.Scan(&rep.DeptID, &rep.DeptName, &rep.TotalRequests); err != nil {
			return nil, err
		}
		reports = append(reports, rep)
	}
	return reports, nil
}

// ─── CANCEL BOOKING ──────────────────────────────────────────────────────────

func (r *ManagementRepository) GetBookingByID(ctx context.Context, id int) (*models.Booking, error) {
	var b models.Booking
	err := r.db.QueryRow(ctx,
		`SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		 FROM bookings WHERE booking_id = $1`, id,
	).Scan(&b.BookingID, &b.RequestID, &b.HallID, &b.RequesterID, &b.EventTitle, &b.EventDate, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt, &b.CompletedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

func (r *ManagementRepository) CancelBooking(ctx context.Context, bookingID int) error {
	_, err := r.db.Exec(ctx, `UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1`, bookingID)
	return err
}
