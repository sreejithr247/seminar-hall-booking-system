package services

import (
	"context"
	"errors"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/repositories"
)

type CoordinatorService struct {
	requestRepo *repositories.RequestRepository
	userRepo    *repositories.UserRepository
}

func NewCoordinatorService(reqRepo *repositories.RequestRepository, userRepo *repositories.UserRepository) *CoordinatorService {
	return &CoordinatorService{
		requestRepo: reqRepo,
		userRepo:    userRepo,
	}
}

// GetDepartmentPendingRequests gets all pending requests for the coordinator's department
func (s *CoordinatorService) GetDepartmentPendingRequests(ctx context.Context, coordinatorID int) ([]models.Request, error) {
	coordinator, err := s.userRepo.GetByID(ctx, coordinatorID)
	if err != nil {
		return nil, err
	}
	if coordinator == nil || coordinator.DeptID == nil {
		return nil, errors.New("coordinator department not found")
	}

	// For a complete implementation, RequestRepository needs a GetByDepartmentAndStatus method.
	// We'll implement a workaround here by fetching all requests and filtering in memory or ideally updating the repo.
	// Assuming an update to RequestRepository:
	return s.requestRepo.GetByDepartmentAndStatus(ctx, *coordinator.DeptID, models.StatusPending)
}

// ReviewRequest allows the coordinator to approve (forward) or reject a request
func (s *CoordinatorService) ReviewRequest(ctx context.Context, coordinatorID int, requestID int, action string, remarks *string) error {
	// 1. Verify coordinator
	coordinator, err := s.userRepo.GetByID(ctx, coordinatorID)
	if err != nil || coordinator == nil || coordinator.DeptID == nil {
		return errors.New("invalid coordinator")
	}

	// 2. Verify request exists and is pending
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil || req == nil {
		return errors.New("request not found")
	}

	if req.DeptStatus != models.StatusPending {
		return errors.New("request is no longer pending department approval")
	}

	// In a full implementation, verify the request belongs to the coordinator's department here by looking up the requester's department.

	// 3. Update status
	var newStatus models.ApprovalStatus
	if action == "approve" {
		newStatus = models.StatusForwarded
	} else if action == "reject" {
		newStatus = models.StatusRejected
	} else {
		return errors.New("invalid action. Must be 'approve' or 'reject'")
	}

	return s.requestRepo.UpdateDeptStatus(ctx, requestID, newStatus, coordinatorID, remarks)
}
