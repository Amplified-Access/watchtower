package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"backend/internal/adapter/handler"
	cacheRepo "backend/internal/adapter/repository/cache"
	pgRepo "backend/internal/adapter/repository/postgres"
	adminuc "backend/internal/usecase/admin"
	alertuc "backend/internal/usecase/alert"
	datasetuuc "backend/internal/usecase/dataset"
	incidentuc "backend/internal/usecase/incident"
	insightuc "backend/internal/usecase/insight"
	orguc "backend/internal/usecase/organization"
	reportuc "backend/internal/usecase/report"
	useruc "backend/internal/usecase/user"
	emailSvc "backend/pkg/email"
	pgClient "backend/pkg/postgres"
	redisClient "backend/pkg/redis"
)

type Server struct {
	port  int
	db    pgClient.Service
	redis redisClient.Service

	orgHandler      *handler.OrganizationHandler
	userHandler     *handler.UserHandler
	incidentHandler *handler.IncidentHandler
	reportHandler   *handler.ReportHandler
	insightHandler  *handler.InsightHandler
	datasetHandler  *handler.DatasetHandler
	alertHandler    *handler.AlertHandler
	adminHandler    *handler.AdminHandler
	emailHandler    *handler.EmailHandler
	userUseCase     *useruc.UseCase
}

func NewServer(dbSvc pgClient.Service, redisSvc redisClient.Service) *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	if port == 0 {
		port = 8080
	}

	sqlDB := dbSvc.DB()
	rdb := redisSvc.Client()

	// Repositories (raw postgres)
	userRepo := pgRepo.NewUserRepository(sqlDB)
	appRepo := pgRepo.NewOrganizationApplicationRepository(sqlDB)
	orgReportRepo := pgRepo.NewOrganizationIncidentReportRepository(sqlDB)
	reportRepo := pgRepo.NewReportRepository(sqlDB)
	alertRepo := pgRepo.NewAlertSubscriptionRepository(sqlDB)

	// Repositories (cache-wrapped)
	sessionRepo := cacheRepo.NewCachedSessionRepository(rdb, pgRepo.NewSessionRepository(sqlDB))
	orgRepo := cacheRepo.NewCachedOrganizationRepository(rdb, pgRepo.NewOrganizationRepository(sqlDB))
	formRepo := cacheRepo.NewCachedFormRepository(rdb, pgRepo.NewFormRepository(sqlDB))
	incidentTypeRepo := cacheRepo.NewCachedIncidentTypeRepository(rdb, pgRepo.NewIncidentTypeRepository(sqlDB))
	incidentRepo := cacheRepo.NewCachedIncidentRepository(rdb, pgRepo.NewIncidentRepository(sqlDB))
	anonReportRepo := cacheRepo.NewCachedAnonymousReportRepository(rdb, pgRepo.NewAnonymousIncidentReportRepository(sqlDB))
	insightRepo := cacheRepo.NewCachedInsightRepository(rdb, pgRepo.NewInsightRepository(sqlDB))
	datasetRepo := cacheRepo.NewCachedDatasetRepository(rdb, pgRepo.NewDatasetRepository(sqlDB))

	// Use cases
	userUC := useruc.New(userRepo, sessionRepo)
	orgUC := orguc.New(orgRepo, appRepo)
	incidentUC := incidentuc.New(incidentRepo, incidentTypeRepo, anonReportRepo, orgReportRepo)
	reportUC := reportuc.New(reportRepo)
	insightUC := insightuc.New(insightRepo)
	datasetUC := datasetuuc.New(datasetRepo)
	alertUC := alertuc.New(alertRepo)
	adminUC := adminuc.New(userRepo, incidentRepo, formRepo, orgRepo, appRepo)

	// Email service
	mailSvc := emailSvc.New()

	// Handlers
	newServer := &Server{
		port:            port,
		db:              dbSvc,
		redis:           redisSvc,
		userHandler:     handler.NewUserHandler(userUC),
		orgHandler:      handler.NewOrganizationHandler(orgUC),
		incidentHandler: handler.NewIncidentHandler(incidentUC),
		reportHandler:   handler.NewReportHandler(reportUC),
		insightHandler:  handler.NewInsightHandler(insightUC),
		datasetHandler:  handler.NewDatasetHandler(datasetUC),
		alertHandler:    handler.NewAlertHandler(alertUC),
		adminHandler:    handler.NewAdminHandler(adminUC),
		emailHandler:    handler.NewEmailHandler(mailSvc),
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
