package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	organizationusecase "backend/internal/usecase/organization"
)

type OrganizationHandler struct {
	uc *organizationusecase.UseCase
}

func NewOrganizationHandler(uc *organizationusecase.UseCase) *OrganizationHandler {
	return &OrganizationHandler{uc: uc}
}

// GetAll godoc
//
//	@Summary		List organizations
//	@Description	Returns a paginated list of all organizations
//	@Tags			Organizations
//	@Produce		json
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc (default: desc)"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/organizations [get]
func (h *OrganizationHandler) GetAll(c *gin.Context) {
	params := parseListParams(c)
	orgs, total, err := h.uc.GetAll(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, orgs, total)
}

// GetBySlug godoc
//
//	@Summary		Get organization by slug
//	@Description	Returns a single organization matching the given slug
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/organizations/{slug} [get]
func (h *OrganizationHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	org, err := h.uc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, org)
}

// SubmitApplication godoc
//
//	@Summary		Submit organization application
//	@Description	Submits an application for a new organization to join the platform
//	@Tags			Organizations
//	@Accept			json
//	@Produce		json
//	@Param			body	body		object{organizationName=string,applicantName=string,applicantEmail=string,website=string,certificateOfIncorporation=string}	true	"Application payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/organizations/apply [post]
func (h *OrganizationHandler) SubmitApplication(c *gin.Context) {
	var input struct {
		OrganizationName           string  `json:"organizationName" binding:"required"`
		ApplicantName              string  `json:"applicantName" binding:"required"`
		ApplicantEmail             string  `json:"applicantEmail" binding:"required,email"`
		Website                    *string `json:"website"`
		CertificateOfIncorporation *string `json:"certificateOfIncorporation"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	app := &entity.OrganizationApplication{
		OrganizationName:           input.OrganizationName,
		ApplicantName:              input.ApplicantName,
		ApplicantEmail:             input.ApplicantEmail,
		Website:                    input.Website,
		CertificateOfIncorporation: input.CertificateOfIncorporation,
		Status:                     entity.ApplicationPending,
	}
	if err := h.uc.SubmitApplication(c.Request.Context(), app); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, gin.H{"message": "application submitted successfully"})
}

// GetApplications godoc
//
//	@Summary		List organization applications
//	@Description	Returns all pending and processed organization applications (super admin only)
//	@Tags			Super Admin – Organizations
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/applications [get]
func (h *OrganizationHandler) GetApplications(c *gin.Context) {
	apps, err := h.uc.GetApplications(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, apps)
}

// ApproveApplication godoc
//
//	@Summary		Approve organization application
//	@Description	Approves a pending organization application (super admin only)
//	@Tags			Super Admin – Organizations
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		int	true	"Application ID"
//	@Success		200	{object}	presenter.Response
//	@Failure		400	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/applications/{id}/approve [post]
func (h *OrganizationHandler) ApproveApplication(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		presenter.BadRequest(c, "invalid application id")
		return
	}
	if err := h.uc.ApproveApplication(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "application approved"})
}

// DeclineApplication godoc
//
//	@Summary		Decline organization application
//	@Description	Declines a pending organization application (super admin only)
//	@Tags			Super Admin – Organizations
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		int	true	"Application ID"
//	@Success		200	{object}	presenter.Response
//	@Failure		400	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/applications/{id}/decline [post]
func (h *OrganizationHandler) DeclineApplication(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		presenter.BadRequest(c, "invalid application id")
		return
	}
	if err := h.uc.DeclineApplication(c.Request.Context(), id); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, gin.H{"message": "application declined"})
}

func parseListParams(c *gin.Context) entity.ListParams {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return entity.ListParams{
		Limit:          limit,
		Offset:        offset,
		Search:        c.Query("search"),
		Sort:          c.DefaultQuery("sort", "created_at"),
		SortOrder:     c.DefaultQuery("sortOrder", "desc"),
		Status:        c.Query("status"),
		Organization: c.Query("organizationId"),
	}
}
