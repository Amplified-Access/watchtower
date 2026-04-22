package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	incidentusecase "backend/internal/usecase/incident"
)

type IncidentHandler struct {
	uc *incidentusecase.UseCase
}

func NewIncidentHandler(uc *incidentusecase.UseCase) *IncidentHandler {
	return &IncidentHandler{uc: uc}
}

func (h *IncidentHandler) GetAllTypes(c *gin.Context) {
	activeOnly := c.Query("activeOnly") != "false"
	types, err := h.uc.GetAllTypes(c.Request.Context(), activeOnly)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

func (h *IncidentHandler) SubmitAnonymousReport(c *gin.Context) {
	var input struct {
		IncidentTypeID string          `json:"incidentTypeId" binding:"required"`
		Location       entity.Location `json:"location" binding:"required"`
		Description    string          `json:"description" binding:"required"`
		Entities       []string        `json:"entities"`
		Injuries       int             `json:"injuries"`
		Fatalities     int             `json:"fatalities"`
		EvidenceFileKey *string        `json:"evidenceFileKey"`
		AudioFileKey   *string         `json:"audioFileKey"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	report := &entity.AnonymousIncidentReport{
		IncidentTypeID:  input.IncidentTypeID,
		Location:        input.Location,
		Description:     input.Description,
		Entities:        input.Entities,
		Injuries:        input.Injuries,
		Fatalities:      input.Fatalities,
		EvidenceFileKey: input.EvidenceFileKey,
		AudioFileKey:    input.AudioFileKey,
	}
	if err := h.uc.SubmitAnonymousReport(c.Request.Context(), report); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, gin.H{"message": "report submitted successfully"})
}

func (h *IncidentHandler) GetAnonymousReports(c *gin.Context) {
	country := c.Query("country")
	category := c.Query("category")
	var countryPtr, categoryPtr *string
	if country != "" {
		countryPtr = &country
	}
	if category != "" {
		categoryPtr = &category
	}
	reports, err := h.uc.GetAnonymousReports(c.Request.Context(), countryPtr, categoryPtr)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, reports)
}

func (h *IncidentHandler) GetHeatmapData(c *gin.Context) {
	data, err := h.uc.GetHeatmapData(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, data)
}

func (h *IncidentHandler) SubmitIncident(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		FormID string                 `json:"formId" binding:"required"`
		Data   map[string]interface{} `json:"data" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	incident := &entity.Incident{
		FormID:           input.FormID,
		OrganizationID:   *user.OrganizationID,
		ReportedByUserID: user.ID,
		Data:             input.Data,
		Status:           entity.IncidentReported,
	}
	if err := h.uc.SubmitIncident(c.Request.Context(), incident); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, gin.H{"message": "incident submitted successfully"})
}

func (h *IncidentHandler) GetOrganizationIncidents(c *gin.Context) {
	user := middleware.CurrentUser(c)
	params := parseListParams(c)
	incidents, total, err := h.uc.GetOrganizationIncidents(c.Request.Context(), *user.OrganizationID, params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, incidents, total)
}

func (h *IncidentHandler) GetIncidentByID(c *gin.Context) {
	id := c.Param("id")
	incident, err := h.uc.GetIncidentByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, incident)
}

func (h *IncidentHandler) UpdateIncidentStatus(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status entity.IncidentStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if err := h.uc.UpdateIncidentStatus(c.Request.Context(), id, input.Status); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "status updated"})
}

func (h *IncidentHandler) DeleteIncident(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteIncident(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

func (h *IncidentHandler) GetAllIncidents(c *gin.Context) {
	params := parseListParams(c)
	incidents, total, err := h.uc.GetAllIncidents(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, incidents, total)
}

func (h *IncidentHandler) GetOrganizationStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	stats, err := h.uc.GetOrganizationStats(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

func (h *IncidentHandler) GetWeeklyTrend(c *gin.Context) {
	user := middleware.CurrentUser(c)
	trend, err := h.uc.GetWeeklyTrend(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, trend)
}

func (h *IncidentHandler) GetPendingIncidents(c *gin.Context) {
	user := middleware.CurrentUser(c)
	incidents, err := h.uc.GetPendingIncidents(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, incidents)
}

func (h *IncidentHandler) GetIncidentTypeAnalytics(c *gin.Context) {
	user := middleware.CurrentUser(c)
	// Placeholder: In a real app, this would query incident counts grouped by type
	analytics := []gin.H{}
	presenter.OK(c, analytics)
}

func (h *IncidentHandler) SubmitOrgReport(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		IncidentTypeID  string          `json:"incidentTypeId" binding:"required"`
		Location        entity.Location `json:"location" binding:"required"`
		Description     string          `json:"description" binding:"required"`
		Entities        []string        `json:"entities"`
		Injuries        int             `json:"injuries"`
		Fatalities      int             `json:"fatalities"`
		Severity        entity.Severity `json:"severity"`
		EvidenceFileKey *string         `json:"evidenceFileKey"`
		AudioFileKey    *string         `json:"audioFileKey"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.Severity == "" {
		input.Severity = entity.SeverityMedium
	}
	report := &entity.OrganizationIncidentReport{
		OrganizationID:   *user.OrganizationID,
		ReportedByUserID: user.ID,
		IncidentTypeID:   input.IncidentTypeID,
		Location:         input.Location,
		Description:      input.Description,
		Entities:         input.Entities,
		Injuries:         input.Injuries,
		Fatalities:       input.Fatalities,
		Severity:         input.Severity,
		EvidenceFileKey:  input.EvidenceFileKey,
		AudioFileKey:     input.AudioFileKey,
	}
	if err := h.uc.SubmitOrgReport(c.Request.Context(), report); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, gin.H{"message": "report submitted successfully"})
}

func (h *IncidentHandler) GetOrgReports(c *gin.Context) {
	user := middleware.CurrentUser(c)
	params := parseListParams(c)
	reports, total, err := h.uc.GetOrgReports(c.Request.Context(), *user.OrganizationID, params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, reports, total)
}

func (h *IncidentHandler) GetTypesByOrganization(c *gin.Context) {
	user := middleware.CurrentUser(c)
	types, err := h.uc.GetTypesByOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

func (h *IncidentHandler) GetAvailableTypes(c *gin.Context) {
	user := middleware.CurrentUser(c)
	types, err := h.uc.GetAvailableTypesForOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

func (h *IncidentHandler) CreateIncidentType(c *gin.Context) {
	var input struct {
		Name        string  `json:"name" binding:"required"`
		Description *string `json:"description"`
		Color       string  `json:"color"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.Color == "" {
		input.Color = "#ef4444"
	}
	t := &entity.IncidentType{
		Name:        input.Name,
		Description: input.Description,
		Color:       input.Color,
		IsActive:    true,
	}
	if err := h.uc.CreateIncidentType(c.Request.Context(), t); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, t)
}

func (h *IncidentHandler) EnableIncidentType(c *gin.Context) {
	user := middleware.CurrentUser(c)
	typeID := c.Param("id")
	if err := h.uc.EnableTypeForOrganization(c.Request.Context(), *user.OrganizationID, typeID); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "incident type enabled"})
}

func (h *IncidentHandler) DisableIncidentType(c *gin.Context) {
	user := middleware.CurrentUser(c)
	typeID := c.Param("id")
	if err := h.uc.DisableTypeForOrganization(c.Request.Context(), *user.OrganizationID, typeID); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "incident type disabled"})
}

func (h *IncidentHandler) GetOrgReportStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	stats, err := h.uc.GetOrgReportStats(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}
