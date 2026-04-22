package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	adminusecase "backend/internal/usecase/admin"
)

type AdminHandler struct {
	uc *adminusecase.UseCase
}

func NewAdminHandler(uc *adminusecase.UseCase) *AdminHandler {
	return &AdminHandler{uc: uc}
}

func (h *AdminHandler) GetOrganizationWatchers(c *gin.Context) {
	watchers, err := h.uc.GetOrganizationWatchers(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, watchers)
}

func (h *AdminHandler) GetOrganizationForms(c *gin.Context) {
	user := middleware.CurrentUser(c)
	forms, err := h.uc.GetOrganizationForms(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, forms)
}

func (h *AdminHandler) GetActiveFormsForWatcher(c *gin.Context) {
	user := middleware.CurrentUser(c)
	forms, err := h.uc.GetActiveFormsForWatcher(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, forms)
}

func (h *AdminHandler) SaveForm(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		Name       string                 `json:"name" binding:"required"`
		Definition map[string]interface{} `json:"definition" binding:"required"`
		IsActive   bool                   `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	form := &entity.Form{
		OrganizationID: *user.OrganizationID,
		Name:           input.Name,
		Definition:     input.Definition,
		IsActive:       input.IsActive,
	}
	if err := h.uc.SaveForm(c.Request.Context(), form); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, form)
}

func (h *AdminHandler) GetFormByID(c *gin.Context) {
	id := c.Param("id")
	form, err := h.uc.GetFormByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, form)
}

func (h *AdminHandler) UpdateForm(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Name       *string                `json:"name"`
		Definition map[string]interface{} `json:"definition"`
		IsActive   *bool                  `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	form, err := h.uc.GetFormByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	if input.Name != nil {
		form.Name = *input.Name
	}
	if input.Definition != nil {
		form.Definition = input.Definition
	}
	if input.IsActive != nil {
		form.IsActive = *input.IsActive
	}
	if err := h.uc.UpdateForm(c.Request.Context(), form); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, form)
}

func (h *AdminHandler) DeleteForm(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteForm(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	stats, err := h.uc.GetDashboardStats(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

func (h *AdminHandler) GetWeeklyTrend(c *gin.Context) {
	user := middleware.CurrentUser(c)
	trend, err := h.uc.GetWeeklyTrend(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, trend)
}

func (h *AdminHandler) GetAllFormsForSuperAdmin(c *gin.Context) {
	params := parseListParams(c)
	forms, total, err := h.uc.GetAllFormsForSuperAdmin(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, forms, total)
}

func (h *AdminHandler) GetPlatformStats(c *gin.Context) {
	stats, err := h.uc.GetPlatformStats(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

func (h *AdminHandler) GetRecentActivity(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	activity, err := h.uc.GetRecentActivity(c.Request.Context(), limit)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, activity)
}
