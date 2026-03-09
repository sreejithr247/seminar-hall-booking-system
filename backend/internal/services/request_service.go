package services

import (
	"context"
	"errors"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/repositories"
	"time"
)

type RequestService struct {
	requestRepo *repositories.RequestRepository
	hallRepo    *repositories.HallRepository
	userRepo    *repositories.UserRepository
}

func NewRequestService(
	reqRepo *repositories.RequestRepository,
	hallRepo *repositories.HallRepository,
	userRepo *repositories.UserRepository,
) *RequestService {
	return &RequestService{
		requestRepo: reqRepo,
		hallRepo:    hallRepo,
		userRepo:    userRepo,
	}
}

// CreateRequest handles the business logic for submitting a new seminar hall request
func (s *RequestService) CreateRequest(ctx context.Context, userID int, req *models.Request) error {
	// 1. Verify user is a requester
	requester, err := s.userRepo.GetRequesterByUserID(ctx, userID)
	if err != nil {
		return err
	}
	if requester == nil {
		return errors.New("user is not registered as a requester (class or club)")
	}

	// 2. Validate basic rules
	if req.ExpectedAttendees != nil && *req.ExpectedAttendees <= 0 {
		return errors.New("expected attendees must be greater than zero")
	}

	// 3. Verify Hall exists and capacity is sufficient
	hall, err := s.hallRepo.GetByID(ctx, req.HallID)
	if err != nil {
		return err
	}
	if hall == nil {
		return errors.New("hall not found")
	}
	if req.ExpectedAttendees != nil && *req.ExpectedAttendees > hall.Capacity {
		return errors.New("expected attendees exceeds hall capacity")
	}

	// 4. Validate time (end_time > start_time)
	startTime, err := time.Parse("15:04:05", req.StartTime)
	if err != nil {
		return errors.New("invalid start_time format, expected HH:MM:SS")
	}
	endTime, err := time.Parse("15:04:05", req.EndTime)
	if err != nil {
		return errors.New("invalid end_time format, expected HH:MM:SS")
	}
	if !endTime.After(startTime) {
		return errors.New("end time must be strictly after start time")
	}
	
	// 5. Build and save request
	req.RequesterID = requester.RequesterID
	
	return s.requestRepo.Create(ctx, req)
}

func (s *RequestService) GetMyRequests(ctx context.Context, userID int) ([]models.Request, error) {
	requester, err := s.userRepo.GetRequesterByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if requester == nil {
		return nil, errors.New("user is not a requester")
	}

	return s.requestRepo.GetByRequester(ctx, requester.RequesterID)
}
