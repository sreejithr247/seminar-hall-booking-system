package handlers

import (
	"net/http"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	adminService *services.AdminService
}

func NewAdminHandler(adminService *services.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// GetPendingRequests gets requests waiting for admin approval
func (h *AdminHandler) GetPendingRequests(c *gin.Context) {
	requests, err := h.adminService.GetPendingRequests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if requests == nil {
		// prevent nil arrays in JSON output
		requests = []models.Request{}
	}

	c.JSON(http.StatusOK, requests)
}

type AdminReviewPayload struct {
	Action  string  `json:"action" binding:"required"` // "approve" or "reject"
	Remarks *string `json:"remarks"`
}

// ReviewRequest approves or rejects an admin request, triggering the final booking
func (h *AdminHandler) ReviewRequest(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(int)

	requestIDStr := c.Param("id")
	requestID, err := strconv.Atoi(requestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	var payload AdminReviewPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.adminService.ReviewRequest(c.Request.Context(), userID, requestID, payload.Action, payload.Remarks)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()}) // Use 409 Conflict if overlap triggers
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "request " + payload.Action + " successfully"})
}

func (h *AdminHandler) GetAllBookings(c *gin.Context) {
	bookings, err := h.adminService.GetAllBookings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if bookings == nil {
		bookings = []models.Booking{}
	}

	c.JSON(http.StatusOK, bookings)
}
