package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"seminar-hall-booking-system/internal/models"
	"seminar-hall-booking-system/internal/repositories"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type ManagementHandler struct {
	mgmtRepo *repositories.ManagementRepository
}

func NewManagementHandler(mgmtRepo *repositories.ManagementRepository) *ManagementHandler {
	return &ManagementHandler{mgmtRepo: mgmtRepo}
}

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

func (h *ManagementHandler) GetDepartments(c *gin.Context) {
	depts, err := h.mgmtRepo.GetAllDepartments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if depts == nil {
		depts = []models.Department{}
	}
	c.JSON(http.StatusOK, depts)
}

func (h *ManagementHandler) CreateDepartment(c *gin.Context) {
	var body struct {
		DeptName string `json:"dept_name" binding:"required"`
		DeptCode string `json:"dept_code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dept, err := h.mgmtRepo.CreateDepartment(c.Request.Context(), body.DeptName, body.DeptCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dept)
}

func (h *ManagementHandler) UpdateDepartment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		DeptName string `json:"dept_name" binding:"required"`
		DeptCode string `json:"dept_code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.mgmtRepo.UpdateDepartment(c.Request.Context(), id, body.DeptName, body.DeptCode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "department updated"})
}

func (h *ManagementHandler) DeleteDepartment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.DeleteDepartment(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "department deleted"})
}

// ─── HALLS ────────────────────────────────────────────────────────────────────

func (h *ManagementHandler) CreateHall(c *gin.Context) {
	var body struct {
		HallName   string                 `json:"hall_name" binding:"required"`
		Capacity   int                    `json:"capacity" binding:"required"`
		Location   *string                `json:"location"`
		Facilities map[string]interface{} `json:"facilities"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hall := &models.Hall{
		HallName:   body.HallName,
		Capacity:   body.Capacity,
		Location:   body.Location,
		Facilities: body.Facilities,
	}
	created, err := h.mgmtRepo.CreateHall(c.Request.Context(), hall)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *ManagementHandler) UpdateHall(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		HallName   string                 `json:"hall_name" binding:"required"`
		Capacity   int                    `json:"capacity" binding:"required"`
		Location   *string                `json:"location"`
		Facilities map[string]interface{} `json:"facilities"`
		IsActive   bool                   `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hall := &models.Hall{
		HallName:   body.HallName,
		Capacity:   body.Capacity,
		Location:   body.Location,
		Facilities: body.Facilities,
		IsActive:   body.IsActive,
	}
	if err := h.mgmtRepo.UpdateHall(c.Request.Context(), id, hall); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "hall updated"})
}

func (h *ManagementHandler) DeleteHall(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.DeleteHall(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "hall deactivated"})
}

// ─── USERS/FACULTY ────────────────────────────────────────────────────────────

func (h *ManagementHandler) GetFaculties(c *gin.Context) {
	users, err := h.mgmtRepo.GetUsersByRole(c.Request.Context(), "faculty")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}

func (h *ManagementHandler) GetAllUsers(c *gin.Context) {
	role := c.Query("role")
	var users []models.User
	var err error
	if role != "" {
		users, err = h.mgmtRepo.GetUsersByRole(c.Request.Context(), role)
	} else {
		// Include inactive users so admin can manage/reactivate them
		users, err = h.mgmtRepo.GetAllUsersIncludingInactive(c.Request.Context())
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if users == nil {
		users = []models.User{}
	}
	c.JSON(http.StatusOK, users)
}

func (h *ManagementHandler) CreateUser(c *gin.Context) {
	var input repositories.CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Username == "" || input.Password == "" || input.FullName == "" || input.Role == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username, password, full_name and role are required"})
		return
	}

	// Hash the password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user, err := h.mgmtRepo.CreateUser(c.Request.Context(), &input, string(hash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user)
}

func (h *ManagementHandler) DeactivateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.DeactivateUser(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user deactivated"})
}

func (h *ManagementHandler) ReactivateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.ReactivateUser(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user reactivated"})
}

func (h *ManagementHandler) UpdateUserPassword(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body struct {
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(body.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	if err := h.mgmtRepo.UpdateUserPassword(c.Request.Context(), id, string(hash)); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}

// ─── CLASSES ──────────────────────────────────────────────────────────────────

func (h *ManagementHandler) GetClasses(c *gin.Context) {
	deptIDStr := c.Query("dept_id")
	if deptIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dept_id query param required"})
		return
	}
	deptID, err := strconv.Atoi(deptIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dept_id"})
		return
	}
	classes, err := h.mgmtRepo.GetClassesByDept(c.Request.Context(), deptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if classes == nil {
		classes = []models.Class{}
	}
	c.JSON(http.StatusOK, classes)
}

func (h *ManagementHandler) CreateClass(c *gin.Context) {
	var body struct {
		ClassName string `json:"class_name" binding:"required"`
		DeptID    int    `json:"dept_id" binding:"required"`
		Year      string `json:"year"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	class, err := h.mgmtRepo.CreateClass(c.Request.Context(), body.ClassName, body.DeptID, body.Year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, class)
}

func (h *ManagementHandler) DeleteClass(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.DeleteClass(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "class deleted"})
}

// ─── CLUBS ────────────────────────────────────────────────────────────────────

func (h *ManagementHandler) GetClubs(c *gin.Context) {
	deptIDStr := c.Query("dept_id")
	var deptID *int
	if deptIDStr != "" {
		id, err := strconv.Atoi(deptIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dept_id"})
			return
		}
		deptID = &id
	}

	clubs, err := h.mgmtRepo.GetAllClubs(c.Request.Context(), deptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if clubs == nil {
		clubs = []models.Club{}
	}
	c.JSON(http.StatusOK, clubs)
}

func (h *ManagementHandler) CreateClub(c *gin.Context) {
	var body struct {
		ClubName    string  `json:"club_name" binding:"required"`
		DeptID      *int    `json:"dept_id"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	club, err := h.mgmtRepo.CreateClub(c.Request.Context(), body.ClubName, body.DeptID, body.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, club)
}

func (h *ManagementHandler) DeleteClub(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.mgmtRepo.DeleteClub(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "club deleted"})
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

func (h *ManagementHandler) GetHallUsageReport(c *gin.Context) {
	report, err := h.mgmtRepo.GetHallUsageReport(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if report == nil {
		report = []models.HallUsageReport{}
	}
	c.JSON(http.StatusOK, report)
}

func (h *ManagementHandler) GetDeptUsageReport(c *gin.Context) {
	report, err := h.mgmtRepo.GetDepartmentUsageReport(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if report == nil {
		report = []models.DepartmentUsageReport{}
	}
	c.JSON(http.StatusOK, report)
}

// ─── CANCEL BOOKING ───────────────────────────────────────────────────────────

func (h *ManagementHandler) CancelBooking(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid booking id"})
		return
	}
	booking, err := h.mgmtRepo.GetBookingByID(c.Request.Context(), id)
	if err != nil || booking == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}
	if booking.Status == "cancelled" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "booking is already cancelled"})
		return
	}
	if err := h.mgmtRepo.CancelBooking(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "booking cancelled"})
}

// suppress unused import warning (json used for JSONB marshalling)
var _ = json.Marshal
