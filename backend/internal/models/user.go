package models

import (
	"time"
)

type UserRole string

const (
	RoleAdmin           UserRole = "admin"
	RoleDeptCoordinator UserRole = "dept_coordinator"
	RoleRequester       UserRole = "requester"
	RoleFaculty         UserRole = "faculty"
)

type User struct {
	UserID      int       `json:"user_id"`
	Username    string    `json:"username"`
	PasswordHash string   `json:"-"` // Never return in JSON
	FullName    string    `json:"full_name"`
	Email       *string   `json:"email"`
	Phone       *string   `json:"phone"`
	Role        UserRole  `json:"role"`
	DeptID      *int      `json:"dept_id"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RequesterType string

const (
	RequesterTypeClass RequesterType = "class"
	RequesterTypeClub  RequesterType = "club"
)

type Requester struct {
	RequesterID   int          `json:"requester_id"`
	UserID        int          `json:"user_id"`
	RequesterType RequesterType `json:"requester_type"`
	ClassID       *int         `json:"class_id"`
	ClubID        *int         `json:"club_id"`
	CreatedAt     time.Time   `json:"created_at"`
}

