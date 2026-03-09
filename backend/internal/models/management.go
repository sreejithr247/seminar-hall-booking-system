package models

import "time"

type Department struct {
	DeptID    int       `json:"dept_id"`
	DeptName  string    `json:"dept_name"`
	DeptCode  *string   `json:"dept_code"`
	CreatedAt time.Time `json:"created_at"`
}

type Class struct {
	ClassID   int    `json:"class_id"`
	ClassName string `json:"class_name"`
	DeptID    int    `json:"dept_id"`
	Year      string `json:"year"`
}

type Club struct {
	ClubID      int     `json:"club_id"`
	ClubName    string  `json:"club_name"`
	DeptID      *int    `json:"dept_id"`
	Description *string `json:"description"`
}

// HallUsageReport – for reporting
type HallUsageReport struct {
	HallID    int    `json:"hall_id"`
	HallName  string `json:"hall_name"`
	TotalBookings int `json:"total_bookings"`
}

// DepartmentUsageReport – for reporting
type DepartmentUsageReport struct {
	DeptID        int    `json:"dept_id"`
	DeptName      string `json:"dept_name"`
	TotalRequests int    `json:"total_requests"`
}
