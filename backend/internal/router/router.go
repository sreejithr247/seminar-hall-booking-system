package router

import (
	"seminar-hall-booking-system/internal/config"
	"seminar-hall-booking-system/internal/handlers"
	"seminar-hall-booking-system/internal/middleware"
	"seminar-hall-booking-system/internal/repositories"
	"seminar-hall-booking-system/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(db *pgxpool.Pool, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORS(cfg.FrontendURL))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Initialize Repositories
	userRepo := repositories.NewUserRepository(db)
	hallRepo := repositories.NewHallRepository(db)
	requestRepo := repositories.NewRequestRepository(db)
	bookingRepo := repositories.NewBookingRepository(db)
	mgmtRepo := repositories.NewManagementRepository(db)

	// Initialize Services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	hallService := services.NewHallService(hallRepo)
	requestService := services.NewRequestService(requestRepo, hallRepo, userRepo)
	coordinatorService := services.NewCoordinatorService(requestRepo, userRepo)
	adminService := services.NewAdminService(requestRepo, bookingRepo)

	// Initialize Handlers
	authHandler := handlers.NewAuthHandler(authService, userRepo)
	hallHandler := handlers.NewHallHandler(hallService)
	requestHandler := handlers.NewRequestHandler(requestService)
	coordinatorHandler := handlers.NewCoordinatorHandler(coordinatorService)
	adminHandler := handlers.NewAdminHandler(adminService)
	mgmtHandler := handlers.NewManagementHandler(mgmtRepo)

	// API routes
	api := r.Group("/api")
	{
		// Public routes
		public := api.Group("")
		{
			public.GET("/halls", hallHandler.GetAllHalls)
			public.GET("/availability", hallHandler.GetAvailability)
			public.GET("/departments", mgmtHandler.GetDepartments)
			public.GET("/clubs", mgmtHandler.GetClubs)
		}

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)

			protectedAuth := auth.Group("")
			protectedAuth.Use(middleware.AuthMiddleware(cfg.JWTSecret))
			protectedAuth.GET("/me", authHandler.GetMe)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Requester routes
			requester := protected.Group("/requests")
			requester.Use(middleware.RequireRole("requester"))
			{
				requester.POST("", requestHandler.CreateRequest)
				requester.GET("/my", requestHandler.GetMyRequests)
			}

			// Dept Coordinator routes
			coordinator := protected.Group("")
			coordinator.Use(middleware.RequireRole("dept_coordinator"))
			{
				coordinator.GET("/requests/dept-pending", coordinatorHandler.GetPendingRequests)
				coordinator.PATCH("/requests/:id/dept-review", coordinatorHandler.ReviewRequest)
				// Dept management
				coordinator.GET("/classes", mgmtHandler.GetClasses)
				coordinator.POST("/classes", mgmtHandler.CreateClass)
				coordinator.DELETE("/classes/:id", mgmtHandler.DeleteClass)
				coordinator.GET("/users/faculties", mgmtHandler.GetFaculties)
			}

			// Admin routes
			admin := protected.Group("")
			admin.Use(middleware.RequireRole("admin"))
			{
				// Request & Booking management
				admin.GET("/requests/admin-pending", adminHandler.GetPendingRequests)
				admin.PATCH("/requests/:id/admin-review", adminHandler.ReviewRequest)
				admin.GET("/bookings", adminHandler.GetAllBookings)
				admin.PATCH("/bookings/:id/cancel", mgmtHandler.CancelBooking)
				// Department management
				admin.POST("/departments", mgmtHandler.CreateDepartment)
				admin.PUT("/departments/:id", mgmtHandler.UpdateDepartment)
				admin.DELETE("/departments/:id", mgmtHandler.DeleteDepartment)
				// Hall management
				admin.POST("/halls", mgmtHandler.CreateHall)
				admin.PUT("/halls/:id", mgmtHandler.UpdateHall)
				admin.DELETE("/halls/:id", mgmtHandler.DeleteHall)
				// User management
				admin.GET("/users", mgmtHandler.GetAllUsers)
				admin.DELETE("/users/:id", mgmtHandler.DeactivateUser)
				// Club management
				admin.POST("/clubs", mgmtHandler.CreateClub)
				admin.DELETE("/clubs/:id", mgmtHandler.DeleteClub)
				// Reports
				admin.GET("/reports/hall-usage", mgmtHandler.GetHallUsageReport)
				admin.GET("/reports/department-usage", mgmtHandler.GetDeptUsageReport)
			}
		}
	}

	return r
}
