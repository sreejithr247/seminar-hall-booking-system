package repositories

import (
	"context"
	"seminar-hall-booking-system/internal/models"
	
	"github.com/jackc/pgx/v5/pgxpool"
)

type BookingRepository struct {
	db *pgxpool.Pool
}

func NewBookingRepository(db *pgxpool.Pool) *BookingRepository {
	return &BookingRepository{db: db}
}

// Create inserts a new booking (trigger actively checks for overlap)
func (r *BookingRepository) Create(ctx context.Context, b *models.Booking) error {
	query := `
		INSERT INTO bookings (request_id, hall_id, requester_id, event_title, event_date, start_time, end_time)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING booking_id, status, created_at
	`
	
	err := r.db.QueryRow(ctx, query,
		b.RequestID,
		b.HallID,
		b.RequesterID,
		b.EventTitle,
		b.EventDate,
		b.StartTime,
		b.EndTime,
	).Scan(&b.BookingID, &b.Status, &b.CreatedAt)

	return err
}

// GetAll returns all bookings
func (r *BookingRepository) GetAll(ctx context.Context) ([]models.Booking, error) {
	query := `
		SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		FROM bookings
		ORDER BY event_date ASC, start_time ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		err := rows.Scan(
			&b.BookingID,
			&b.RequestID,
			&b.HallID,
			&b.RequesterID,
			&b.EventTitle,
			&b.EventDate,
			&b.StartTime,
			&b.EndTime,
			&b.Status,
			&b.CreatedAt,
			&b.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}

	return bookings, nil
}

// GetByRequester returns all bookings for a specific requester
func (r *BookingRepository) GetByRequester(ctx context.Context, requesterID int) ([]models.Booking, error) {
	query := `
		SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		FROM bookings
		WHERE requester_id = $1
		ORDER BY event_date DESC
	`

	rows, err := r.db.Query(ctx, query, requesterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		err := rows.Scan(
			&b.BookingID,
			&b.RequestID,
			&b.HallID,
			&b.RequesterID,
			&b.EventTitle,
			&b.EventDate,
			&b.StartTime,
			&b.EndTime,
			&b.Status,
			&b.CreatedAt,
			&b.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}

	return bookings, nil
}

// UpdateStatus allows changing a booking's status
func (r *BookingRepository) UpdateStatus(ctx context.Context, bookingID int, status models.BookingStatus) error {
	query := `UPDATE bookings SET status = $1 WHERE booking_id = $2`
	_, err := r.db.Exec(ctx, query, status, bookingID)
	return err
}
