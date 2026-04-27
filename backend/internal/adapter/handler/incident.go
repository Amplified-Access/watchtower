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

// GetAllTypes godoc
//
//	@Summary		List incident types
//	@Description	Returns all incident types; pass activeOnly=false to include inactive ones
//	@Tags			Incidents
//	@Produce		json
//	@Param			activeOnly	query		bool	false	"Include inactive types when false (default: true)"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/incident-types [get]
func (h *IncidentHandler) GetAllTypes(c *gin.Context) {
	activeOnly := c.Query("activeOnly") != "false"
	types, err := h.uc.GetAllTypes(c.Request.Context(), activeOnly)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

// SubmitAnonymousReport godoc
//
//	@Summary		Submit anonymous incident report
//	@Description	Submits an incident report without requiring authentication
//	@Tags			Incidents
//	@Accept			json
//	@Produce		json
//	@Param			body	body		object{incidentTypeId=string,location=object,description=string,entities=[]string,injuries=int,fatalities=int,evidenceFileKey=string,audioFileKey=string}	true	"Anonymous report payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/incidents/anonymous [post]
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

// GetAnonymousReports godoc
//
//	@Summary		List anonymous incident reports
//	@Description	Returns anonymous incident reports, optionally filtered by country and category
//	@Tags			Incidents
//	@Produce		json
//	@Param			country		query		string	false	"Filter by country code"
//	@Param			category	query		string	false	"Filter by incident category"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/incidents/anonymous [get]
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

// GetHeatmapData godoc
//
//	@Summary		Get incident heatmap data
//	@Description	Returns geographic coordinate data for rendering an incident heatmap
//	@Tags			Incidents
//	@Produce		json
//	@Success		200	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/incidents/heatmap [get]
func (h *IncidentHandler) GetHeatmapData(c *gin.Context) {
	data, err := h.uc.GetHeatmapData(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, data)
}

// SubmitIncident godoc
//
//	@Summary		Submit form-based incident
//	@Description	Submits an incident report using a specific form schema (watcher only)
//	@Tags			Watcher – Incidents
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{formId=string,data=object}	true	"Incident payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/incidents [post]
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

// GetOrganizationIncidents godoc
//
//	@Summary		List organization incidents
//	@Description	Returns a paginated list of incidents for the authenticated admin's organization
//	@Tags			Admin – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		401			{object}	presenter.Response
//	@Failure		403			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/admin/incidents [get]
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

// GetIncidentByID godoc
//
//	@Summary		Get incident by ID
//	@Description	Returns a single incident by its UUID. Accessible to admins and super admins.
//	@Tags			Admin – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Incident UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/incidents/{id} [get]
func (h *IncidentHandler) GetIncidentByID(c *gin.Context) {
	id := c.Param("id")
	incident, err := h.uc.GetIncidentByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, incident)
}

// UpdateIncidentStatus godoc
//
//	@Summary		Update incident status
//	@Description	Changes the status of an incident. Accessible to admins and super admins.
//	@Tags			Admin – Incidents
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string					true	"Incident UUID"
//	@Param			body	body		object{status=string}	true	"New status"
//	@Success		200		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/incidents/{id}/status [patch]
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

// DeleteIncident godoc
//
//	@Summary		Delete incident
//	@Description	Permanently removes an incident from the platform (super admin only)
//	@Tags			Super Admin – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Incident UUID"
//	@Success		204
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/incidents/{id} [delete]
func (h *IncidentHandler) DeleteIncident(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteIncident(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

// GetAllIncidents godoc
//
//	@Summary		List all incidents
//	@Description	Returns a paginated list of all incidents across the platform (super admin only)
//	@Tags			Super Admin – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		401			{object}	presenter.Response
//	@Failure		403			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/superadmin/incidents [get]
func (h *IncidentHandler) GetAllIncidents(c *gin.Context) {
	params := parseListParams(c)
	incidents, total, err := h.uc.GetAllIncidents(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, incidents, total)
}

// GetOrganizationStats godoc
//
//	@Summary		Get organization incident statistics
//	@Description	Returns aggregate incident counts and metrics for the admin's organization
//	@Tags			Admin – Analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/analytics/stats [get]
func (h *IncidentHandler) GetOrganizationStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.OrganizationID == nil {
		presenter.BadRequest(c, "user not associated with an organization")
		return
	}
	stats, err := h.uc.GetOrganizationStats(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

// GetWeeklyTrend godoc
//
//	@Summary		Get weekly incident trend
//	@Description	Returns incident counts grouped by day for the past week
//	@Tags			Admin – Analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/analytics/trend [get]
func (h *IncidentHandler) GetWeeklyTrend(c *gin.Context) {
	user := middleware.CurrentUser(c)
	trend, err := h.uc.GetWeeklyTrend(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, trend)
}

// GetPendingIncidents godoc
//
//	@Summary		List pending incidents
//	@Description	Returns all incidents in a pending/unreviewed state for the admin's organization
//	@Tags			Admin – Analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/analytics/pending [get]
func (h *IncidentHandler) GetPendingIncidents(c *gin.Context) {
	user := middleware.CurrentUser(c)
	incidents, err := h.uc.GetPendingIncidents(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, incidents)
}

// GetIncidentTypeAnalytics godoc
//
//	@Summary		Get incident type analytics
//	@Description	Returns incident counts grouped by type for the admin's organization
//	@Tags			Admin – Analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Router			/admin/analytics/types [get]
func (h *IncidentHandler) GetIncidentTypeAnalytics(c *gin.Context) {
	// Placeholder: In a real app, this would query incident counts grouped by type
	analytics := []gin.H{}
	presenter.OK(c, analytics)
}

// SubmitOrgReport godoc
//
//	@Summary		Submit organization incident report
//	@Description	Submits a structured incident report on behalf of the watcher's organization
//	@Tags			Watcher – Incidents
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{incidentTypeId=string,location=object,description=string,entities=[]string,injuries=int,fatalities=int,severity=string,evidenceFileKey=string,audioFileKey=string}	true	"Organization report payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/org/incident-reports [post]
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

// GetOrgReports godoc
//
//	@Summary		List organization incident reports
//	@Description	Returns paginated incident reports submitted by the watcher's organization
//	@Tags			Watcher – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		401			{object}	presenter.Response
//	@Failure		403			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/org/incident-reports [get]
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

// GetTypesByOrganization godoc
//
//	@Summary		List organization's incident types
//	@Description	Returns incident types that have been enabled for the admin's organization
//	@Tags			Admin – Incident Types
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/incident-types [get]
func (h *IncidentHandler) GetTypesByOrganization(c *gin.Context) {
	user := middleware.CurrentUser(c)
	types, err := h.uc.GetTypesByOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

// GetAvailableTypes godoc
//
//	@Summary		List available incident types
//	@Description	Returns platform-wide incident types not yet enabled for the admin's organization
//	@Tags			Admin – Incident Types
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/incident-types/available [get]
func (h *IncidentHandler) GetAvailableTypes(c *gin.Context) {
	user := middleware.CurrentUser(c)
	types, err := h.uc.GetAvailableTypesForOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, types)
}

// CreateIncidentType godoc
//
//	@Summary		Create incident type
//	@Description	Creates a new platform-wide incident type (admin only)
//	@Tags			Admin – Incident Types
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{name=string,description=string,color=string}	true	"Incident type payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/incident-types [post]
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

// EnableIncidentType godoc
//
//	@Summary		Enable incident type for organization
//	@Description	Adds an incident type to the set available within the admin's organization
//	@Tags			Admin – Incident Types
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Incident type UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/incident-types/{id}/enable [post]
func (h *IncidentHandler) EnableIncidentType(c *gin.Context) {
	user := middleware.CurrentUser(c)
	typeID := c.Param("id")
	if err := h.uc.EnableTypeForOrganization(c.Request.Context(), *user.OrganizationID, typeID); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "incident type enabled"})
}

// DisableIncidentType godoc
//
//	@Summary		Disable incident type for organization
//	@Description	Removes an incident type from the admin's organization without deleting it globally
//	@Tags			Admin – Incident Types
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Incident type UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/incident-types/{id}/disable [post]
func (h *IncidentHandler) DisableIncidentType(c *gin.Context) {
	user := middleware.CurrentUser(c)
	typeID := c.Param("id")
	if err := h.uc.DisableTypeForOrganization(c.Request.Context(), *user.OrganizationID, typeID); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "incident type disabled"})
}

// GetOrgReportStats godoc
//
//	@Summary		Get organization report statistics
//	@Description	Returns summary statistics for the watcher's organization incident reports
//	@Tags			Watcher – Incidents
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/org/incident-reports/stats [get]
func (h *IncidentHandler) GetOrgReportStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	stats, err := h.uc.GetOrgReportStats(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}
