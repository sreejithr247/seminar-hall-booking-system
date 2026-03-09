package handlers

import (
	"net/http"
	"seminar-hall-booking-system/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

type HallHandler struct {
	hallService *services.HallService
}

func NewHallHandler(hallService *services.HallService) *HallHandler {
	return &HallHandler{hallService: hallService}
}

// GetAllHalls returns a list of all active halls
func (h *HallHandler) GetAllHalls(c *gin.Context) {
	halls, err := h.hallService.GetAllHalls(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch halls"})
		return
	}
	
	c.JSON(http.StatusOK, halls)
}

// GetAvailability returns bookings for a hall on a specific date
func (h *HallHandler) GetAvailability(c *gin.Context) {
	hallIDStr := c.Query("hall_id")
	dateStr := c.Query("date") // Format: YYYY-MM-DD
	
	if hallIDStr == "" || dateStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hall_id and date query parameters are required"})
		return
	}
	
	hallID, err := strconv.Atoi(hallIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hall_id"})
		return
	}
	
	bookings, err := h.hallService.GetAvailability(c.Request.Context(), hallID, dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format or failed to fetch availability. Use YYYY-MM-DD."})
		return
	}
	
	c.JSON(http.StatusOK, bookings)
}
