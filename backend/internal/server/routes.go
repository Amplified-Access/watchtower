package server

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"backend/internal/adapter/middleware"
	"backend/internal/domain/entity"
)

func (s *Server) RegisterRoutes() http.Handler {
	r := gin.New()
	r.Use(gin.Recovery(), middleware.Logger())

	allowedOrigins := []string{"http://localhost:3000"}
	if raw := os.Getenv("ALLOWED_ORIGINS"); raw != "" {
		allowedOrigins = strings.Split(raw, ",")
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health
	r.GET("/", s.HelloWorldHandler)
	r.GET("/health", s.healthHandler)

	// Auth middleware instances
	authMW := middleware.Auth(s.userUseCase)
	adminMW := middleware.RequireRole(entity.RoleAdmin, entity.RoleSuperAdmin)
	superAdminMW := middleware.RequireRole(entity.RoleSuperAdmin)
	orgMW := middleware.RequireOrganization()

	// ── Public routes ──────────────────────────────────────────────
	pub := r.Group("/api/v1")
	{
		// Organizations
		pub.GET("/organizations", s.orgHandler.GetAll)
		pub.GET("/organizations/:slug", s.orgHandler.GetBySlug)
		pub.POST("/organizations/apply", s.orgHandler.SubmitApplication)

		// Incident types
		pub.GET("/incident-types", s.incidentHandler.GetAllTypes)

		// Anonymous incident reports
		pub.POST("/incidents/anonymous", s.incidentHandler.SubmitAnonymousReport)
		pub.GET("/incidents/anonymous", s.incidentHandler.GetAnonymousReports)
		pub.GET("/incidents/heatmap", s.incidentHandler.GetHeatmapData)

		// Public insights
		pub.GET("/insights", s.insightHandler.GetPublicInsights)
		pub.GET("/insights/tags", s.insightHandler.GetTags)
		pub.GET("/insights/:slug", s.insightHandler.GetPublicInsightBySlug)

		// Public reports
		pub.GET("/reports", s.reportHandler.GetPublicReports)
		pub.GET("/reports/:id", s.reportHandler.GetPublicReportByID)

		// Public datasets
		pub.GET("/datasets", s.datasetHandler.GetPublicDatasets)
		pub.GET("/datasets/categories", s.datasetHandler.GetCategories)
		pub.GET("/datasets/:id", s.datasetHandler.GetDatasetByID)
		pub.POST("/datasets/:id/download", s.datasetHandler.IncrementDownload)

		// Alert subscriptions
		pub.POST("/alerts", s.alertHandler.Create)
		pub.GET("/alerts", s.alertHandler.GetByEmail)
		pub.PATCH("/alerts/:id", s.alertHandler.Update)
		pub.POST("/alerts/:id/deactivate", s.alertHandler.Deactivate)
		pub.POST("/alerts/:id/activate", s.alertHandler.Activate)

		// Internal email (protected by X-Internal-Token header)
		pub.POST("/email/send", s.emailHandler.Send)
	}

	// ── Authenticated routes ───────────────────────────────────────
	auth := r.Group("/api/v1", authMW)
	{
		auth.GET("/me", s.userHandler.GetCurrentUser)

		// Watcher: submit form-based incidents and access forms
		watcher := auth.Group("", orgMW)
		{
			watcher.POST("/incidents", s.incidentHandler.SubmitIncident)
			watcher.GET("/watcher/forms", s.adminHandler.GetActiveFormsForWatcher)
			watcher.POST("/org/incident-reports", s.incidentHandler.SubmitOrgReport)
			watcher.GET("/org/incident-reports", s.incidentHandler.GetOrgReports)
			watcher.GET("/org/incident-reports/stats", s.incidentHandler.GetOrgReportStats)
		}

		// Admin: organization management
		admin := auth.Group("/admin", adminMW, orgMW)
		{
			admin.GET("/forms", s.adminHandler.GetOrganizationForms)
			admin.POST("/forms", s.adminHandler.SaveForm)
			admin.GET("/forms/:id", s.adminHandler.GetFormByID)
			admin.PATCH("/forms/:id", s.adminHandler.UpdateForm)
			admin.DELETE("/forms/:id", s.adminHandler.DeleteForm)

			admin.GET("/watchers", s.userHandler.GetAllWatchers)

			admin.GET("/incident-types", s.incidentHandler.GetTypesByOrganization)
			admin.GET("/incident-types/available", s.incidentHandler.GetAvailableTypes)
			admin.POST("/incident-types", s.incidentHandler.CreateIncidentType)
			admin.POST("/incident-types/:id/enable", s.incidentHandler.EnableIncidentType)
			admin.POST("/incident-types/:id/disable", s.incidentHandler.DisableIncidentType)

			admin.GET("/incidents", s.incidentHandler.GetOrganizationIncidents)
			admin.GET("/incidents/:id", s.incidentHandler.GetIncidentByID)
			admin.PATCH("/incidents/:id/status", s.incidentHandler.UpdateIncidentStatus)

			admin.GET("/analytics/stats", s.incidentHandler.GetOrganizationStats)
			admin.GET("/analytics/trend", s.incidentHandler.GetWeeklyTrend)
			admin.GET("/analytics/pending", s.incidentHandler.GetPendingIncidents)
			admin.GET("/analytics/types", s.incidentHandler.GetIncidentTypeAnalytics)
			admin.GET("/dashboard", s.adminHandler.GetDashboardStats)

			admin.GET("/reports", s.reportHandler.GetOrganizationReports)
			admin.POST("/reports", s.reportHandler.CreateReport)
			admin.GET("/reports/:id", s.reportHandler.GetReportByID)
			admin.PATCH("/reports/:id", s.reportHandler.UpdateReport)
			admin.DELETE("/reports/:id", s.reportHandler.DeleteReport)

			admin.POST("/insights", s.insightHandler.CreateInsight)
		}

		// Super admin: platform management
		superAdmin := auth.Group("/superadmin", superAdminMW)
		{
			superAdmin.GET("/applications", s.orgHandler.GetApplications)
			superAdmin.POST("/applications/:id/approve", s.orgHandler.ApproveApplication)
			superAdmin.POST("/applications/:id/decline", s.orgHandler.DeclineApplication)

			superAdmin.GET("/users/admins", s.userHandler.GetAllAdmins)
			superAdmin.GET("/users/watchers", s.userHandler.GetAllWatchers)

			superAdmin.GET("/incidents", s.incidentHandler.GetAllIncidents)
			superAdmin.GET("/incidents/:id", s.incidentHandler.GetIncidentByID)
			superAdmin.PATCH("/incidents/:id/status", s.incidentHandler.UpdateIncidentStatus)
			superAdmin.DELETE("/incidents/:id", s.incidentHandler.DeleteIncident)

			superAdmin.GET("/forms", s.adminHandler.GetAllFormsForSuperAdmin)
			superAdmin.GET("/forms/:id", s.adminHandler.GetFormByID)
			superAdmin.PATCH("/forms/:id", s.adminHandler.UpdateForm)
			superAdmin.DELETE("/forms/:id", s.adminHandler.DeleteForm)

			superAdmin.GET("/reports", s.reportHandler.GetAllReports)

			superAdmin.GET("/datasets", s.datasetHandler.GetAllDatasets)
			superAdmin.POST("/datasets", s.datasetHandler.CreateDataset)
			superAdmin.DELETE("/datasets/:id", s.datasetHandler.DeleteDataset)

			superAdmin.GET("/alerts/active", s.alertHandler.GetAllActive)
			superAdmin.GET("/alerts/stats", s.alertHandler.GetStats)

			superAdmin.GET("/dashboard/stats", s.adminHandler.GetPlatformStats)
			superAdmin.GET("/dashboard/activity", s.adminHandler.GetRecentActivity)
		}
	}

	return r
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Hello World"})
}

func (s *Server) healthHandler(c *gin.Context) {
	health := map[string]any{
		"db":    s.db.Health(),
		"redis": s.redis.Health(),
	}
	c.JSON(http.StatusOK, health)
}
