package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	reportusecase "backend/internal/usecase/report"
)

type ReportHandler struct {
	uc *reportusecase.UseCase
}

func NewReportHandler(uc *reportusecase.UseCase) *ReportHandler {
	return &ReportHandler{uc: uc}
}

// GetPublicReports godoc
//
//	@Summary		List public reports
//	@Description	Returns a paginated list of publicly visible reports
//	@Tags			Reports
//	@Produce		json
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/reports [get]
func (h *ReportHandler) GetPublicReports(c *gin.Context) {
	params := parseListParams(c)
	reports, total, err := h.uc.GetPublicReports(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, reports, total)
}

// GetPublicReportByID godoc
//
//	@Summary		Get public report by ID
//	@Description	Returns a single published report by its UUID
//	@Tags			Reports
//	@Produce		json
//	@Param			id	path		string	true	"Report UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/reports/{id} [get]
func (h *ReportHandler) GetPublicReportByID(c *gin.Context) {
	id := c.Param("id")
	report, err := h.uc.GetPublicReportByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, report)
}

// GetOrganizationReports godoc
//
//	@Summary		List organization reports
//	@Description	Returns all reports belonging to the authenticated user's organization
//	@Tags			Admin – Reports
//	@Produce		json
//	@Security		BearerAuth
//	@Param			status	query		string	false	"Filter by status (draft, published, archived)"
//	@Success		200		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/reports [get]
func (h *ReportHandler) GetOrganizationReports(c *gin.Context) {
	user := middleware.CurrentUser(c)
	statusStr := c.Query("status")
	var status *entity.ReportStatus
	if statusStr != "" {
		s := entity.ReportStatus(statusStr)
		status = &s
	}
	reports, err := h.uc.GetOrganizationReports(c.Request.Context(), *user.OrganizationID, status)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, reports)
}

// CreateReport godoc
//
//	@Summary		Create report
//	@Description	Creates a new report for the authenticated admin's organization
//	@Tags			Admin – Reports
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{title=string,fileKey=string,status=string}	true	"Report payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/reports [post]
func (h *ReportHandler) CreateReport(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		Title   string               `json:"title" binding:"required"`
		FileKey string               `json:"fileKey" binding:"required"`
		Status  entity.ReportStatus  `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.Status == "" {
		input.Status = entity.ReportDraft
	}
	report := &entity.Report{
		OrganizationID:   *user.OrganizationID,
		ReportedByUserID: user.ID,
		Title:            input.Title,
		FileKey:          input.FileKey,
		Status:           input.Status,
	}
	if err := h.uc.CreateReport(c.Request.Context(), report); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, report)
}

// GetReportByID godoc
//
//	@Summary		Get report by ID
//	@Description	Returns a single report by its UUID
//	@Tags			Admin – Reports
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Report UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/reports/{id} [get]
func (h *ReportHandler) GetReportByID(c *gin.Context) {
	id := c.Param("id")
	report, err := h.uc.GetReportByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, report)
}

// UpdateReport godoc
//
//	@Summary		Update report
//	@Description	Updates the title or status of an existing report
//	@Tags			Admin – Reports
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string							true	"Report UUID"
//	@Param			body	body		object{title=string,status=string}	true	"Fields to update"
//	@Success		200		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/reports/{id} [patch]
func (h *ReportHandler) UpdateReport(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Title  *string              `json:"title"`
		Status *entity.ReportStatus `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	report, err := h.uc.GetReportByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	if input.Title != nil {
		report.Title = *input.Title
	}
	if input.Status != nil {
		report.Status = *input.Status
	}
	if err := h.uc.UpdateReport(c.Request.Context(), report); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, report)
}

// DeleteReport godoc
//
//	@Summary		Delete report
//	@Description	Permanently removes a report
//	@Tags			Admin – Reports
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Report UUID"
//	@Success		204
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/reports/{id} [delete]
func (h *ReportHandler) DeleteReport(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteReport(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

// GetAllReports godoc
//
//	@Summary		List all reports
//	@Description	Returns a paginated list of all reports across the platform (super admin only)
//	@Tags			Super Admin – Reports
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Success		200			{object}	presenter.Response
//	@Failure		401			{object}	presenter.Response
//	@Failure		403			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/superadmin/reports [get]
func (h *ReportHandler) GetAllReports(c *gin.Context) {
	params := parseListParams(c)
	reports, total, err := h.uc.GetAllReports(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, reports, total)
}
