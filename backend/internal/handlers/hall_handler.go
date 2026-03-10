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

// GetHallByID returns details for a single hall
func (h *HallHandler) GetHallByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hall id"})
		return
	}

	hall, err := h.hallService.GetHallByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hall details"})
		return
	}

	if hall == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "hall not found"})
		return
	}

	c.JSON(http.StatusOK, hall)
}

// GetAvailability returns bookings for a hall (if hall_id provided) or all halls (if hall_id omitted) on a specific date
func (h *HallHandler) GetAvailability(c *gin.Context) {
	hallIDStr := c.Query("hall_id")
	dateStr := c.Query("date") // Format: YYYY-MM-DD
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	
	if dateStr == "" && (startDateStr == "" || endDateStr == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date or (start_date and end_date) query parameters are required"})
		return
	}
	
	// If hall_id is provided, return bookings for that hall ONLY (original behavior)
	if hallIDStr != "" {
		hallID, err := strconv.Atoi(hallIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hall_id"})
			return
		}
		
		// If range is provided
		if startDateStr != "" && endDateStr != "" {
			bookings, err := h.hallService.GetAvailabilityRange(c.Request.Context(), hallID, startDateStr, endDateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch range availability. Use YYYY-MM-DD."})
				return
			}
			c.JSON(http.StatusOK, bookings)
			return
		}

		// Fallback to single date
		bookings, err := h.hallService.GetAvailability(c.Request.Context(), hallID, dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch availability. Use YYYY-MM-DD."})
			return
		}
		c.JSON(http.StatusOK, bookings)
		return
	}

	// If hall_id is MISSING, return availability for ALL halls (new behavior)
	slots, err := h.hallService.GetAvailabilityForAll(c.Request.Context(), dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to fetch availability. Use YYYY-MM-DD."})
		return
	}
	
	c.JSON(http.StatusOK, slots)
}
