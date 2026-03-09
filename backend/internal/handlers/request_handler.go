package handlers

import (
	"fmt"
	"net/http"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/services"
	"time"

	"github.com/gin-gonic/gin"
)

type RequestHandler struct {
	requestService *services.RequestService
}

func NewRequestHandler(requestService *services.RequestService) *RequestHandler {
	return &RequestHandler{requestService: requestService}
}

type CreateRequestPayload struct {
	HallID            int     `json:"hall_id" binding:"required"`
	EventTitle        string  `json:"event_title" binding:"required"`
	EventDescription  *string `json:"event_description"`
	EventDate         string  `json:"event_date" binding:"required"` // YYYY-MM-DD
	StartTime         string  `json:"start_time" binding:"required"` // HH:MM
	EndTime           string  `json:"end_time" binding:"required"`   // HH:MM
	ExpectedAttendees *int    `json:"expected_attendees"`
	Purpose           *string `json:"purpose"`
}

// CreateRequest creates a new booking request for a student/club
func (h *RequestHandler) CreateRequest(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(int)

	var payload CreateRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date
	eventDate, err := time.Parse("2006-01-02", payload.EventDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event_date format (use YYYY-MM-DD)"})
		return
	}

	// Format times string slightly (adding seconds if omitted by client)
	startTime := payload.StartTime
	if len(startTime) == 5 {
		startTime += ":00"
	}
	endTime := payload.EndTime
	if len(endTime) == 5 {
		endTime += ":00"
	}

	req := models.Request{
		HallID:            payload.HallID,
		EventTitle:        payload.EventTitle,
		EventDescription:  payload.EventDescription,
		EventDate:         eventDate,
		StartTime:         startTime,
		EndTime:           endTime,
		ExpectedAttendees: payload.ExpectedAttendees,
		Purpose:           payload.Purpose,
	}

	err = h.requestService.CreateRequest(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "request submitted successfully",
		"data":    req,
	})
}

// GetMyRequests gets all requests made by the current authenticated requester
func (h *RequestHandler) GetMyRequests(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		fmt.Println("No user_id in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(int)

	requests, err := h.requestService.GetMyRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Make sure we never return null for a slice in JSON
	if requests == nil {
		requests = []models.Request{}
	}

	c.JSON(http.StatusOK, requests)
}
