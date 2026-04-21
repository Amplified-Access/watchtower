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

func (h *ReportHandler) GetPublicReports(c *gin.Context) {
	params := parseListParams(c)
	reports, total, err := h.uc.GetPublicReports(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, reports, total)
}

func (h *ReportHandler) GetPublicReportByID(c *gin.Context) {
	id := c.Param("id")
	report, err := h.uc.GetPublicReportByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, report)
}

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

func (h *ReportHandler) GetReportByID(c *gin.Context) {
	id := c.Param("id")
	report, err := h.uc.GetReportByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, report)
}

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

func (h *ReportHandler) DeleteReport(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteReport(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

func (h *ReportHandler) GetAllReports(c *gin.Context) {
	params := parseListParams(c)
	reports, total, err := h.uc.GetAllReports(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, reports, total)
}
