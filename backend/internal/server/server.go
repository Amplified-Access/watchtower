package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"backend/internal/adapter/handler"
	cacheRepo "backend/internal/adapter/repository/cache"
	pgRepo "backend/internal/adapter/repository/postgres"
	adminuc "backend/internal/usecase/admin"
	analyticsuc "backend/internal/usecase/analytics"
	alertuc "backend/internal/usecase/alert"
	assistantuc "backend/internal/usecase/assistant"
	authuc "backend/internal/usecase/auth"
	datasetuuc "backend/internal/usecase/dataset"
	fileuc "backend/internal/usecase/file"
	incidentuc "backend/internal/usecase/incident"
	insightuc "backend/internal/usecase/insight"
	orguc "backend/internal/usecase/organization"
	reportuc "backend/internal/usecase/report"
	useruc "backend/internal/usecase/user"
	emailSvc "backend/pkg/email"
	"backend/pkg/gemini"
	pgClient "backend/pkg/postgres"
	"backend/pkg/r2"
	redisClient "backend/pkg/redis"
)

type Server struct {
	port  int
	db    pgClient.Service
	redis redisClient.Service

	orgHandler       *handler.OrganizationHandler
	userHandler      *handler.UserHandler
	incidentHandler  *handler.IncidentHandler
	reportHandler    *handler.ReportHandler
	insightHandler   *handler.InsightHandler
	datasetHandler   *handler.DatasetHandler
	alertHandler     *handler.AlertHandler
	adminHandler     *handler.AdminHandler
	emailHandler     *handler.EmailHandler
	authHandler      *handler.AuthHandler
	assistantHandler *handler.AssistantHandler
	analyticsHandler *handler.AnalyticsHandler
	fileHandler      *handler.FileHandler
	userUseCase      *useruc.UseCase
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
	authRepo := pgRepo.NewAuthRepository(sqlDB)
	appRepo := pgRepo.NewOrganizationApplicationRepository(sqlDB)
	orgReportRepo := pgRepo.NewOrganizationIncidentReportRepository(sqlDB)
	reportRepo := pgRepo.NewReportRepository(sqlDB)
	alertRepo := pgRepo.NewAlertSubscriptionRepository(sqlDB)
	knowledgeRepo := pgRepo.NewKnowledgeRepository(sqlDB)

	// Repositories (cache-wrapped)
	sessionRepo := cacheRepo.NewCachedSessionRepository(rdb, pgRepo.NewSessionRepository(sqlDB))
	orgRepo := cacheRepo.NewCachedOrganizationRepository(rdb, pgRepo.NewOrganizationRepository(sqlDB))
	formRepo := cacheRepo.NewCachedFormRepository(rdb, pgRepo.NewFormRepository(sqlDB))
	incidentTypeRepo := cacheRepo.NewCachedIncidentTypeRepository(rdb, pgRepo.NewIncidentTypeRepository(sqlDB))
	incidentRepo := cacheRepo.NewCachedIncidentRepository(rdb, pgRepo.NewIncidentRepository(sqlDB))
	anonReportRepo := cacheRepo.NewCachedAnonymousReportRepository(rdb, pgRepo.NewAnonymousIncidentReportRepository(sqlDB))
	insightRepo := cacheRepo.NewCachedInsightRepository(rdb, pgRepo.NewInsightRepository(sqlDB))
	datasetRepo := cacheRepo.NewCachedDatasetRepository(rdb, pgRepo.NewDatasetRepository(sqlDB))

	// Email service
	mailSvc := emailSvc.New()

	// Use cases
	userUC := useruc.New(userRepo, sessionRepo)
	authUC := authuc.New(userRepo, authRepo, mailSvc)
	orgUC := orguc.New(orgRepo, appRepo, userRepo)
	incidentUC := incidentuc.New(incidentRepo, incidentTypeRepo, anonReportRepo, orgReportRepo)
	reportUC := reportuc.New(reportRepo)
	insightUC := insightuc.New(insightRepo)
	datasetUC := datasetuuc.New(datasetRepo)
	alertUC := alertuc.New(alertRepo)
	assistantUC := assistantuc.New(gemini.New(), knowledgeRepo)
	analyticsUC := analyticsuc.New(anonReportRepo)
	fileUC := fileuc.New(r2.New(), allowedExternalDomains())
	adminUC := adminuc.New(userRepo, incidentRepo, formRepo, orgRepo, appRepo, orgReportRepo, anonReportRepo)

	// Handlers
	newServer := &Server{
		port:             port,
		db:               dbSvc,
		redis:            redisSvc,
		userHandler:      handler.NewUserHandler(userUC),
		orgHandler:       handler.NewOrganizationHandler(orgUC),
		incidentHandler:  handler.NewIncidentHandler(incidentUC),
		reportHandler:    handler.NewReportHandler(reportUC),
		insightHandler:   handler.NewInsightHandler(insightUC),
		datasetHandler:   handler.NewDatasetHandler(datasetUC),
		alertHandler:     handler.NewAlertHandler(alertUC),
		adminHandler:     handler.NewAdminHandler(adminUC),
		emailHandler:     handler.NewEmailHandler(mailSvc),
		authHandler:      handler.NewAuthHandler(authUC),
		assistantHandler: handler.NewAssistantHandler(assistantUC),
		analyticsHandler: handler.NewAnalyticsHandler(analyticsUC),
		fileHandler:      handler.NewFileHandler(fileUC),
		userUseCase:      userUC,
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

// allowedExternalDomains reads ALLOWED_EXTERNAL_DOMAINS, the comma-separated
// hosts a file key may point at when it's a full URL ("*" allows any).
func allowedExternalDomains() []string {
	var domains []string
	for _, d := range strings.Split(os.Getenv("ALLOWED_EXTERNAL_DOMAINS"), ",") {
		if d = strings.TrimSpace(d); d != "" {
			domains = append(domains, d)
		}
	}
	return domains
}
