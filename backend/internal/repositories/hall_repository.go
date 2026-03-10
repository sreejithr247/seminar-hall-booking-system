package repositories

import (
	"context"
	"seminar-hall-booking-system/internal/models"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HallRepository struct {
	db *pgxpool.Pool
}

func NewHallRepository(db *pgxpool.Pool) *HallRepository {
	return &HallRepository{db: db}
}

func (r *HallRepository) GetAll(ctx context.Context) ([]models.Hall, error) {
	query := `
		SELECT hall_id, hall_name, capacity, location, facilities, is_active
		FROM halls
		WHERE is_active = true
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	halls := []models.Hall{}
	for rows.Next() {
		var hall models.Hall
		err := rows.Scan(
			&hall.HallID,
			&hall.HallName,
			&hall.Capacity,
			&hall.Location,
			&hall.Facilities,
			&hall.IsActive,
		)
		if err != nil {
			return nil, err
		}
		halls = append(halls, hall)
	}

	return halls, nil
}

func (r *HallRepository) GetByID(ctx context.Context, id int) (*models.Hall, error) {
	query := `
		SELECT hall_id, hall_name, capacity, location, facilities, is_active
		FROM halls
		WHERE hall_id = $1 AND is_active = true
	`

	var hall models.Hall
	err := r.db.QueryRow(ctx, query, id).Scan(
		&hall.HallID,
		&hall.HallName,
		&hall.Capacity,
		&hall.Location,
		&hall.Facilities,
		&hall.IsActive,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &hall, nil
}

// GetAvailability gets all confirmed bookings for a specific hall on a specific date
func (r *HallRepository) GetAvailability(ctx context.Context, hallID int, date time.Time) ([]models.Booking, error) {
	query := `
		SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		FROM bookings
		WHERE hall_id = $1 AND event_date = $2 AND status != 'cancelled'
		ORDER BY start_time ASC
	`

	rows, err := r.db.Query(ctx, query, hallID, date.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bookings := []models.Booking{}
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

// GetAvailabilityRange gets all confirmed bookings for a specific hall between two dates
func (r *HallRepository) GetAvailabilityRange(ctx context.Context, hallID int, startDate time.Time, endDate time.Time) ([]models.Booking, error) {
	query := `
		SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		FROM bookings
		WHERE hall_id = $1 AND event_date BETWEEN $2 AND $3 AND status != 'cancelled'
		ORDER BY event_date ASC, start_time ASC
	`

	rows, err := r.db.Query(ctx, query, hallID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bookings := []models.Booking{}
	for rows.Next() {
		var b models.Booking
		err := rows.Scan(
			&b.BookingID, &b.RequestID, &b.HallID, &b.RequesterID,
			&b.EventTitle, &b.EventDate, &b.StartTime, &b.EndTime,
			&b.Status, &b.CreatedAt, &b.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		bookings = append(bookings, b)
	}

	return bookings, nil
}
// GetAvailabilityForAll gets confirmed bookings for ALL active halls on a specific date
func (r *HallRepository) GetAvailabilityForAll(ctx context.Context, date time.Time) ([]models.AvailabilitySlot, error) {
	// 1. Get all active halls
	halls, err := r.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// 2. Get all bookings for that date
	query := `
		SELECT booking_id, request_id, hall_id, requester_id, event_title, event_date, start_time, end_time, status, created_at, completed_at
		FROM bookings
		WHERE event_date = $1 AND status != 'cancelled'
		ORDER BY start_time ASC
	`
	rows, err := r.db.Query(ctx, query, date.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// 3. Group bookings by hall_id
	bookingsByHall := make(map[int][]models.Booking)
	for rows.Next() {
		var b models.Booking
		err := rows.Scan(
			&b.BookingID, &b.RequestID, &b.HallID, &b.RequesterID,
			&b.EventTitle, &b.EventDate, &b.StartTime, &b.EndTime,
			&b.Status, &b.CreatedAt, &b.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		bookingsByHall[b.HallID] = append(bookingsByHall[b.HallID], b)
	}

	// 4. Map halls to availability slots
	var slots []models.AvailabilitySlot
	for _, h := range halls {
		bookings := bookingsByHall[h.HallID]
		if bookings == nil {
			bookings = []models.Booking{}
		}
		slots = append(slots, models.AvailabilitySlot{
			HallID:   h.HallID,
			HallName: h.HallName,
			Bookings: bookings,
		})
	}

	return slots, nil
}
