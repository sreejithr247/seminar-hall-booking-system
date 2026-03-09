package repositories

import (
	"context"
	"seminar-hall-booking-system/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RequestRepository struct {
	db *pgxpool.Pool
}

func NewRequestRepository(db *pgxpool.Pool) *RequestRepository {
	return &RequestRepository{db: db}
}

// Create new request
func (r *RequestRepository) Create(ctx context.Context, req *models.Request) error {
	query := `
		INSERT INTO requests (requester_id, hall_id, event_title, event_description, event_date, start_time, end_time, expected_attendees, purpose)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING request_id, dept_status, admin_status, requested_at
	`

	err := r.db.QueryRow(ctx, query,
		req.RequesterID,
		req.HallID,
		req.EventTitle,
		req.EventDescription,
		req.EventDate,
		req.StartTime,
		req.EndTime,
		req.ExpectedAttendees,
		req.Purpose,
	).Scan(&req.RequestID, &req.DeptStatus, &req.AdminStatus, &req.RequestedAt)

	return err
}

// GetByID gets a specific request
func (r *RequestRepository) GetByID(ctx context.Context, id int) (*models.Request, error) {
	query := `
		SELECT request_id, requester_id, hall_id, event_title, event_description, event_date, start_time, end_time, 
		expected_attendees, purpose, dept_status, dept_approved_by, dept_approved_at, dept_remarks, 
		admin_status, admin_approved_by, admin_approved_at, admin_remarks, requested_at, is_cancelled
		FROM requests
		WHERE request_id = $1
	`

	var req models.Request
	err := r.db.QueryRow(ctx, query, id).Scan(
		&req.RequestID,
		&req.RequesterID,
		&req.HallID,
		&req.EventTitle,
		&req.EventDescription,
		&req.EventDate,
		&req.StartTime,
		&req.EndTime,
		&req.ExpectedAttendees,
		&req.Purpose,
		&req.DeptStatus,
		&req.DeptApprovedBy,
		&req.DeptApprovedAt,
		&req.DeptRemarks,
		&req.AdminStatus,
		&req.AdminApprovedBy,
		&req.AdminApprovedAt,
		&req.AdminRemarks,
		&req.RequestedAt,
		&req.IsCancelled,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}

	return &req, nil
}

// GetByRequester gets all requests for a specific requester
func (r *RequestRepository) GetByRequester(ctx context.Context, requesterID int) ([]models.Request, error) {
	query := `
		SELECT request_id, requester_id, hall_id, event_title, event_description, event_date, start_time, end_time, 
		expected_attendees, purpose, dept_status, dept_approved_by, dept_approved_at, dept_remarks, 
		admin_status, admin_approved_by, admin_approved_at, admin_remarks, requested_at, is_cancelled
		FROM requests
		WHERE requester_id = $1
		ORDER BY requested_at DESC
	`

	rows, err := r.db.Query(ctx, query, requesterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.Request
	for rows.Next() {
		var req models.Request
		err := rows.Scan(
			&req.RequestID,
			&req.RequesterID,
			&req.HallID,
			&req.EventTitle,
			&req.EventDescription,
			&req.EventDate,
			&req.StartTime,
			&req.EndTime,
			&req.ExpectedAttendees,
			&req.Purpose,
			&req.DeptStatus,
			&req.DeptApprovedBy,
			&req.DeptApprovedAt,
			&req.DeptRemarks,
			&req.AdminStatus,
			&req.AdminApprovedBy,
			&req.AdminApprovedAt,
			&req.AdminRemarks,
			&req.RequestedAt,
			&req.IsCancelled,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}

	return requests, nil
}

// UpdateDeptStatus updates the dept status
func (r *RequestRepository) UpdateDeptStatus(ctx context.Context, reqID int, status models.ApprovalStatus, byUserID int, remarks *string) error {
	query := `
		UPDATE requests 
		SET dept_status = $1, dept_approved_by = $2, dept_approved_at = NOW(), dept_remarks = $3
		WHERE request_id = $4
	`
	_, err := r.db.Exec(ctx, query, status, byUserID, remarks, reqID)
	return err
}

// UpdateAdminStatus updates the admin status
func (r *RequestRepository) UpdateAdminStatus(ctx context.Context, reqID int, status models.ApprovalStatus, byUserID int, remarks *string) error {
	query := `
		UPDATE requests 
		SET admin_status = $1, admin_approved_by = $2, admin_approved_at = NOW(), admin_remarks = $3
		WHERE request_id = $4
	`
	_, err := r.db.Exec(ctx, query, status, byUserID, remarks, reqID)
	return err
}

// GetByDepartmentAndStatus gets pending requests for a specific department
func (r *RequestRepository) GetByDepartmentAndStatus(ctx context.Context, deptID int, status models.ApprovalStatus) ([]models.Request, error) {
	// A bit tricky because we have to join with requesters -> users to find the dept_id
	query := `
		SELECT r.request_id, r.requester_id, r.hall_id, r.event_title, r.event_description, r.event_date, r.start_time, r.end_time, 
		r.expected_attendees, r.purpose, r.dept_status, r.dept_approved_by, r.dept_approved_at, r.dept_remarks, 
		r.admin_status, r.admin_approved_by, r.admin_approved_at, r.admin_remarks, r.requested_at, r.is_cancelled
		FROM requests r
		JOIN requesters req ON r.requester_id = req.requester_id
		JOIN users u ON req.user_id = u.user_id
		WHERE u.dept_id = $1 AND r.dept_status = $2
		ORDER BY r.requested_at ASC
	`

	rows, err := r.db.Query(ctx, query, deptID, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.Request
	for rows.Next() {
		var req models.Request
		err := rows.Scan(
			&req.RequestID,
			&req.RequesterID,
			&req.HallID,
			&req.EventTitle,
			&req.EventDescription,
			&req.EventDate,
			&req.StartTime,
			&req.EndTime,
			&req.ExpectedAttendees,
			&req.Purpose,
			&req.DeptStatus,
			&req.DeptApprovedBy,
			&req.DeptApprovedAt,
			&req.DeptRemarks,
			&req.AdminStatus,
			&req.AdminApprovedBy,
			&req.AdminApprovedAt,
			&req.AdminRemarks,
			&req.RequestedAt,
			&req.IsCancelled,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, nil
}

// GetByAdminStatus gets requests that have a certain admin status (and dept status)
func (r *RequestRepository) GetByAdminStatus(ctx context.Context, adminStatus models.ApprovalStatus, deptStatus models.ApprovalStatus) ([]models.Request, error) {
	query := `
		SELECT request_id, requester_id, hall_id, event_title, event_description, event_date, start_time, end_time, 
		expected_attendees, purpose, dept_status, dept_approved_by, dept_approved_at, dept_remarks, 
		admin_status, admin_approved_by, admin_approved_at, admin_remarks, requested_at, is_cancelled
		FROM requests
		WHERE admin_status = $1 AND dept_status = $2
		ORDER BY requested_at ASC
	`

	rows, err := r.db.Query(ctx, query, adminStatus, deptStatus)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.Request
	for rows.Next() {
		var req models.Request
		err := rows.Scan(
			&req.RequestID,
			&req.RequesterID,
			&req.HallID,
			&req.EventTitle,
			&req.EventDescription,
			&req.EventDate,
			&req.StartTime,
			&req.EndTime,
			&req.ExpectedAttendees,
			&req.Purpose,
			&req.DeptStatus,
			&req.DeptApprovedBy,
			&req.DeptApprovedAt,
			&req.DeptRemarks,
			&req.AdminStatus,
			&req.AdminApprovedBy,
			&req.AdminApprovedAt,
			&req.AdminRemarks,
			&req.RequestedAt,
			&req.IsCancelled,
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, nil
}

