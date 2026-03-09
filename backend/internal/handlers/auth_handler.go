package handlers

import (
	"net/http"
	"seminar-hall-booking-system/internal/repositories"
	"seminar-hall-booking-system/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *services.AuthService
	userRepo    *repositories.UserRepository
}

func NewAuthHandler(authService *services.AuthService, userRepo *repositories.UserRepository) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userRepo:    userRepo,
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Set HTTP-only cookie for the JWT
	c.SetCookie("auth_token", token, 3600*24*7, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"token":   token,
		"user":    user,
	})
}

// Logout clears the auth cookie
func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// GetMe returns the authenticated user's details
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Fetch fresh user details from DB
	user, err := h.userRepo.GetByID(c.Request.Context(), userID.(int))
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// Check if user is a requester and fetch requester info
	// if user.Role == models.RoleRequester
	if user.Role == "requester" {
		reqInfo, err := h.userRepo.GetRequesterByUserID(c.Request.Context(), user.UserID)
		if err == nil && reqInfo != nil {
			c.JSON(http.StatusOK, gin.H{"user": user, "requester": reqInfo})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
