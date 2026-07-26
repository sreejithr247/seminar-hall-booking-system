package models

import (
	"time"
)

type ApprovalStatus string

const (
	StatusPending   ApprovalStatus = "pending"
	StatusForwarded ApprovalStatus = "forwarded"
	StatusApproved  ApprovalStatus = "approved"
	StatusRejected  ApprovalStatus = "rejected"
	StatusAmended   ApprovalStatus = "amended"
)

type BookingStatus string

const (
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusCompleted BookingStatus = "completed"
	BookingStatusNoShow    BookingStatus = "no_show"
)

type Hall struct {
	HallID     int                    `json:"hall_id"`
	HallName   string                 `json:"hall_name"`
	Capacity   int                    `json:"capacity"`
	Location   *string                `json:"location"`
	Facilities map[string]interface{} `json:"facilities"`
	IsActive   bool                   `json:"is_active"`
}

type Request struct {
	RequestID         int            `json:"request_id"`
	RequesterID       int            `json:"requester_id"`
	HallID            int            `json:"hall_id"`
	HallName          *string        `json:"hall_name,omitempty"`
	HallLocation      *string        `json:"hall_location,omitempty"`
	HallCapacity      *int           `json:"hall_capacity,omitempty"`
	EventTitle        string         `json:"event_title"`
	EventDescription  *string        `json:"event_description"`
	EventDate         time.Time      `json:"event_date"`
	StartTime         string         `json:"start_time"` // TIME format
	EndTime           string         `json:"end_time"`   // TIME format
	ExpectedAttendees *int           `json:"expected_attendees"`
	Purpose           *string        `json:"purpose"`
	DeptStatus        ApprovalStatus `json:"dept_status"`
	DeptApprovedBy    *int           `json:"dept_approved_by"`
	DeptApprovedAt    *time.Time     `json:"dept_approved_at"`
	DeptRemarks       *string        `json:"dept_remarks"`
	AdminStatus       ApprovalStatus `json:"admin_status"`
	AdminApprovedBy   *int           `json:"admin_approved_by"`
	AdminApprovedAt   *time.Time     `json:"admin_approved_at"`
	AdminRemarks      *string        `json:"admin_remarks"`
	RequestedAt       time.Time      `json:"requested_at"`
	IsCancelled       bool           `json:"is_cancelled"`
}

type Booking struct {
	BookingID   int           `json:"booking_id"`
	RequestID   int           `json:"request_id"`
	HallID      int           `json:"hall_id"`
	RequesterID int           `json:"requester_id"`
	EventTitle  string        `json:"event_title"`
	EventDate   time.Time     `json:"event_date"`
	StartTime   string        `json:"start_time"`
	EndTime     string        `json:"end_time"`
	Status      BookingStatus `json:"status"`
	CreatedAt   time.Time     `json:"created_at"`
	CompletedAt *time.Time    `json:"completed_at"`
}

type AvailabilitySlot struct {
	HallID   int       `json:"hall_id"`
	HallName string    `json:"hall_name"`
	Bookings []Booking `json:"bookings"`
}

