package services

import (
	"context"
	"errors"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/repositories"
)

type AdminService struct {
	requestRepo *repositories.RequestRepository
	bookingRepo *repositories.BookingRepository
}

func NewAdminService(reqRepo *repositories.RequestRepository, bookingRepo *repositories.BookingRepository) *AdminService {
	return &AdminService{
		requestRepo: reqRepo,
		bookingRepo: bookingRepo,
	}
}

// GetPendingRequests gets all requests forwarded by departments
func (s *AdminService) GetPendingRequests(ctx context.Context) ([]models.Request, error) {
	return s.requestRepo.GetByAdminStatus(ctx, models.StatusPending, models.StatusForwarded)
}

// ReviewRequest allows the admin to approve or reject a forwarded request
func (s *AdminService) ReviewRequest(ctx context.Context, adminID int, requestID int, action string, remarks *string) error {
	req, err := s.requestRepo.GetByID(ctx, requestID)
	if err != nil || req == nil {
		return errors.New("request not found")
	}

	if req.DeptStatus != models.StatusForwarded {
		return errors.New("request has not been forwarded by the department")
	}
	if req.AdminStatus != models.StatusPending {
		return errors.New("request is no longer pending admin approval")
	}

	var newStatus models.ApprovalStatus
	if action == "approve" {
		newStatus = models.StatusApproved
		
		// Before approving, check if there's an existing overlapping booking
		overlap, err := s.bookingRepo.CheckOverlap(ctx, req.HallID, req.EventDate, req.StartTime, req.EndTime)
		if err != nil {
			return err
		}
		if overlap {
			return errors.New("cannot approve: this request overlaps with an existing confirmed booking")
		}

		// Attempt to create the final booking.
		// NOTE: If an overlap exists, the PostgreSQL trigger 'check_booking_overlap' will abort this query and return a database error.
		booking := &models.Booking{
			RequestID:   req.RequestID,
			HallID:      req.HallID,
			RequesterID: req.RequesterID,
			EventTitle:  req.EventTitle,
			EventDate:   req.EventDate,
			StartTime:   req.StartTime,
			EndTime:     req.EndTime,
		}
		
		err = s.bookingRepo.Create(ctx, booking)
		if err != nil {
			// Trigger fired and aborted the transaction due to overlap OR some other DB issue
			return errors.New("failed to confirm booking: time slot may already be taken or overlaps with an existing booking")
		}

	} else if action == "reject" {
		newStatus = models.StatusRejected
	} else {
		return errors.New("invalid action. Must be 'approve' or 'reject'")
	}

	return s.requestRepo.UpdateAdminStatus(ctx, requestID, newStatus, adminID, remarks)
}

func (s *AdminService) GetAllBookings(ctx context.Context) ([]models.Booking, error) {
	return s.bookingRepo.GetAll(ctx)
}
