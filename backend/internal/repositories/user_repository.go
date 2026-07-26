package repositories

import (
	"context"
	"seminar-hall-booking-system/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `
		SELECT user_id, username, password_hash, full_name, email, phone, role, dept_id, is_active, created_at, updated_at
		FROM users
		WHERE username = $1 AND is_active = true
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.UserID,
		&user.Username,
		&user.PasswordHash,
		&user.FullName,
		&user.Email,
		&user.Phone,
		&user.Role,
		&user.DeptID,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int) (*models.User, error) {
	query := `
		SELECT user_id, username, password_hash, full_name, email, phone, role, dept_id, is_active, created_at, updated_at
		FROM users
		WHERE user_id = $1 AND is_active = true
	`

	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.UserID,
		&user.Username,
		&user.PasswordHash,
		&user.FullName,
		&user.Email,
		&user.Phone,
		&user.Role,
		&user.DeptID,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetRequesterByUserID(ctx context.Context, userID int) (*models.Requester, error) {
	query := `
		SELECT requester_id, user_id, requester_type, class_id, club_id, created_at
		FROM requesters
		WHERE user_id = $1
	`

	var req models.Requester
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&req.RequesterID,
		&req.UserID,
		&req.RequesterType,
		&req.ClassID,
		&req.ClubID,
		&req.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &req, nil
}

// UpdatePasswordHash updates the bcrypt hash for an active user.
func (r *UserRepository) UpdatePasswordHash(ctx context.Context, userID int, passwordHash string) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2 AND is_active = true`,
		passwordHash, userID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
