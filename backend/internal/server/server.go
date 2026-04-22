package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"backend/internal/adapter/handler"
	pgRepo "backend/internal/adapter/repository/postgres"
	"backend/internal/database"
	adminuc "backend/internal/usecase/admin"
	alertuc "backend/internal/usecase/alert"
	datasetuuc "backend/internal/usecase/dataset"
	incidentuc "backend/internal/usecase/incident"
	insightuc "backend/internal/usecase/insight"
	orguc "backend/internal/usecase/organization"
	reportuc "backend/internal/usecase/report"
	useruc "backend/internal/usecase/user"
)

type Server struct {
	port int
	db   database.Service

	orgHandler      *handler.OrganizationHandler
	userHandler     *handler.UserHandler
	incidentHandler *handler.IncidentHandler
	reportHandler   *handler.ReportHandler
	insightHandler  *handler.InsightHandler
	datasetHandler  *handler.DatasetHandler
	alertHandler    *handler.AlertHandler
	adminHandler    *handler.AdminHandler
	userUseCase     *useruc.UseCase
}

func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	if port == 0 {
		port = 8080
	}

	dbSvc := database.New()
	sqlDB := dbSvc.DB()

	// Repositories
	userRepo := pgRepo.NewUserRepository(sqlDB)
	sessionRepo := pgRepo.NewSessionRepository(sqlDB)
	orgRepo := pgRepo.NewOrganizationRepository(sqlDB)
	appRepo := pgRepo.NewOrganizationApplicationRepository(sqlDB)
	incidentTypeRepo := pgRepo.NewIncidentTypeRepository(sqlDB)
	incidentRepo := pgRepo.NewIncidentRepository(sqlDB)
	anonReportRepo := pgRepo.NewAnonymousIncidentReportRepository(sqlDB)
	orgReportRepo := pgRepo.NewOrganizationIncidentReportRepository(sqlDB)
	formRepo := pgRepo.NewFormRepository(sqlDB)
	reportRepo := pgRepo.NewReportRepository(sqlDB)
	insightRepo := pgRepo.NewInsightRepository(sqlDB)
	datasetRepo := pgRepo.NewDatasetRepository(sqlDB)
	alertRepo := pgRepo.NewAlertSubscriptionRepository(sqlDB)

	// Use cases
	userUC := useruc.New(userRepo, sessionRepo)
	orgUC := orguc.New(orgRepo, appRepo)
	incidentUC := incidentuc.New(incidentRepo, incidentTypeRepo, anonReportRepo, orgReportRepo)
	reportUC := reportuc.New(reportRepo)
	insightUC := insightuc.New(insightRepo)
	datasetUC := datasetuuc.New(datasetRepo)
	alertUC := alertuc.New(alertRepo)
	adminUC := adminuc.New(userRepo, incidentRepo, formRepo)

	// Handlers
	newServer := &Server{
		port:            port,
		db:              dbSvc,
		userHandler:     handler.NewUserHandler(userUC),
		orgHandler:      handler.NewOrganizationHandler(orgUC),
		incidentHandler: handler.NewIncidentHandler(incidentUC),
		reportHandler:   handler.NewReportHandler(reportUC),
		insightHandler:  handler.NewInsightHandler(insightUC),
		datasetHandler:  handler.NewDatasetHandler(datasetUC),
		alertHandler:    handler.NewAlertHandler(alertUC),
		adminHandler:    handler.NewAdminHandler(adminUC),
		userUseCase:     userUC,
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", newServer.port),
		Handler:      newServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return srv
}
