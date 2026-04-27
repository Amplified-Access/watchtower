package handler

import (
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

// GetOrganizationForms godoc
//
//	@Summary		List organization forms
//	@Description	Returns all forms belonging to the admin's organization
//	@Tags			Admin – Forms
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/forms [get]
func (h *AdminHandler) GetOrganizationForms(c *gin.Context) {
	user := middleware.CurrentUser(c)
	forms, err := h.uc.GetOrganizationForms(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, forms)
}

// GetActiveFormsForWatcher godoc
//
//	@Summary		List active forms for watcher
//	@Description	Returns forms that are active in the watcher's organization
//	@Tags			Watcher – Forms
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/watcher/forms [get]
func (h *AdminHandler) GetActiveFormsForWatcher(c *gin.Context) {
	user := middleware.CurrentUser(c)
	forms, err := h.uc.GetActiveFormsForWatcher(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, forms)
}

// SaveForm godoc
//
//	@Summary		Create form
//	@Description	Creates a new incident form for the admin's organization
//	@Tags			Admin – Forms
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{name=string,definition=object,isActive=bool}	true	"Form payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/forms [post]
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

// GetFormByID godoc
//
//	@Summary		Get form by ID
//	@Description	Returns a single form by its UUID. Accessible to admins and super admins.
//	@Tags			Admin – Forms
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Form UUID"
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/forms/{id} [get]
func (h *AdminHandler) GetFormByID(c *gin.Context) {
	id := c.Param("id")
	form, err := h.uc.GetFormByID(c.Request.Context(), id)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, form)
}

// UpdateForm godoc
//
//	@Summary		Update form
//	@Description	Updates name, definition, or active state of a form. Accessible to admins and super admins.
//	@Tags			Admin – Forms
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string									true	"Form UUID"
//	@Param			body	body		object{name=string,definition=object,isActive=bool}	true	"Fields to update"
//	@Success		200		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/forms/{id} [patch]
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

// DeleteForm godoc
//
//	@Summary		Delete form
//	@Description	Permanently removes a form. Accessible to admins and super admins.
//	@Tags			Admin – Forms
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Form UUID"
//	@Success		204
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/forms/{id} [delete]
func (h *AdminHandler) DeleteForm(c *gin.Context) {
	id := c.Param("id")
	if err := h.uc.DeleteForm(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.NoContent(c)
}

// GetDashboardStats godoc
//
//	@Summary		Get admin dashboard statistics
//	@Description	Returns aggregate stats for the admin's organization dashboard
//	@Tags			Admin – Dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/dashboard [get]
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.OrganizationID == nil {
		presenter.BadRequest(c, "user not associated with an organization")
		return
	}
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

// GetAllFormsForSuperAdmin godoc
//
//	@Summary		List all forms
//	@Description	Returns a paginated list of all forms across the platform (super admin only)
//	@Tags			Super Admin – Forms
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
//	@Router			/superadmin/forms [get]
func (h *AdminHandler) GetAllFormsForSuperAdmin(c *gin.Context) {
	params := parseListParams(c)
	forms, total, err := h.uc.GetAllFormsForSuperAdmin(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, forms, total)
}

// GetPlatformStats godoc
//
//	@Summary		Get platform statistics
//	@Description	Returns aggregate statistics across the entire platform (super admin only)
//	@Tags			Super Admin – Dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/dashboard/stats [get]
func (h *AdminHandler) GetPlatformStats(c *gin.Context) {
	stats, err := h.uc.GetPlatformStats(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, stats)
}

// GetRecentActivity godoc
//
//	@Summary		Get recent platform activity
//	@Description	Returns the most recent activity events across the platform (super admin only)
//	@Tags			Super Admin – Dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Param			limit	query		int	false	"Number of events to return (default: 10)"
//	@Success		200		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/superadmin/dashboard/activity [get]
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

// GetPlatformActivityTrend godoc
//
//	@Summary		Get platform activity trend
//	@Description	Returns weekly incident counts over the past 7 weeks (super admin only)
//	@Tags			Super Admin – Dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/dashboard/trend [get]
func (h *AdminHandler) GetPlatformActivityTrend(c *gin.Context) {
	trend, err := h.uc.GetPlatformActivityTrend(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, trend)
}

func (h *AdminHandler) GetPlatformReportsByType(c *gin.Context) {
	dist, err := h.uc.GetPlatformReportsByType(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, dist)
}

func (h *AdminHandler) GetCurrentOrganization(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.OrganizationID == nil {
		presenter.BadRequest(c, "no organization")
		return
	}
	org, err := h.uc.GetOrganizationByID(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, org)
}
