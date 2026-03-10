package services

import (
	"context"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/repositories"
	"time"
)

type HallService struct {
	hallRepo *repositories.HallRepository
}

func NewHallService(hallRepo *repositories.HallRepository) *HallService {
	return &HallService{hallRepo: hallRepo}
}

func (s *HallService) GetAllHalls(ctx context.Context) ([]models.Hall, error) {
	return s.hallRepo.GetAll(ctx)
}

func (s *HallService) GetHallByID(ctx context.Context, id int) (*models.Hall, error) {
	return s.hallRepo.GetByID(ctx, id)
}

func (s *HallService) GetAvailability(ctx context.Context, hallID int, dateStr string) ([]models.Booking, error) {
	// Parse date string (YYYY-MM-DD)
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, err
	}
	
	return s.hallRepo.GetAvailability(ctx, hallID, date)
}

func (s *HallService) GetAvailabilityForAll(ctx context.Context, dateStr string) ([]models.AvailabilitySlot, error) {
	// Parse date string (YYYY-MM-DD)
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, err
	}
	
	return s.hallRepo.GetAvailabilityForAll(ctx, date)
}

func (s *HallService) GetAvailabilityRange(ctx context.Context, hallID int, startDateStr string, endDateStr string) ([]models.Booking, error) {
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return nil, err
	}
	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		return nil, err
	}
	
	return s.hallRepo.GetAvailabilityRange(ctx, hallID, startDate, endDate)
}
