package handlers

import (
	"net/http"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CoordinatorHandler struct {
	coordinatorService *services.CoordinatorService
}

func NewCoordinatorHandler(coordinatorService *services.CoordinatorService) *CoordinatorHandler {
	return &CoordinatorHandler{coordinatorService: coordinatorService}
}

// GetPendingRequests gets requests waiting for department approval
func (h *CoordinatorHandler) GetPendingRequests(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDStr.(int)

	requests, err := h.coordinatorService.GetDepartmentPendingRequests(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if requests == nil {
		requests = []models.Request{}
	}

	c.JSON(http.StatusOK, requests)
}

type ReviewRequestPayload struct {
	Action  string  `json:"action" binding:"required"` // "approve" or "reject"
	Remarks *string `json:"remarks"`
}

// ReviewRequest approves or rejects a department request
func (h *CoordinatorHandler) ReviewRequest(c *gin.Context) {
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

	var payload ReviewRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.coordinatorService.ReviewRequest(c.Request.Context(), userID, requestID, payload.Action, payload.Remarks)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "request " + payload.Action + " successfully"})
}
