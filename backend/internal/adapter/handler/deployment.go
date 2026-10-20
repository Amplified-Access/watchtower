package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	deploymentusecase "backend/internal/usecase/deployment"
)

type DeploymentHandler struct {
	uc *deploymentusecase.UseCase
}

func NewDeploymentHandler(uc *deploymentusecase.UseCase) *DeploymentHandler {
	return &DeploymentHandler{uc: uc}
}

// GetOrganizationDeployments godoc
//
//	@Summary		List the organization's deployments
//	@Description	Returns the deployments of the authenticated admin's organization, newest first, each with its incident types
//	@Tags			Admin – Deployments
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/deployments [get]
func (h *DeploymentHandler) GetOrganizationDeployments(c *gin.Context) {
	user := middleware.CurrentUser(c)
	deployments, err := h.uc.ListForOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, deployments)
}

// GetOrganizationDeploymentCounts godoc
//
//	@Summary		Count the organization's deployments
//	@Description	Returns how many deployments the authenticated admin's organization has, in total and by status
//	@Tags			Admin – Deployments
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/deployments/counts [get]
func (h *DeploymentHandler) GetOrganizationDeploymentCounts(c *gin.Context) {
	user := middleware.CurrentUser(c)
	counts, err := h.uc.CountsForOrganization(c.Request.Context(), *user.OrganizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, counts)
}

// CreateDeployment godoc
//
//	@Summary		Create a deployment
//	@Description	Creates a deployment for the authenticated admin's organization. It needs a name and at least one incident type; its slug is made from the name. Status defaults to draft. Dates are RFC 3339.
//	@Tags			Admin – Deployments
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		entity.NewDeployment	true	"Deployment"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		409		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/deployments [post]
func (h *DeploymentHandler) CreateDeployment(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input entity.NewDeployment
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	deployment, err := h.uc.Create(c.Request.Context(), *user.OrganizationID, input)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, deployment)
}

// GetPublicDeployment godoc
//
//	@Summary		Get a deployment
//	@Description	Returns a live or closed deployment by its slug, with its organization's name and incident types, for its public page and reporting link. Drafts are not found.
//	@Tags			Deployments
//	@Produce		json
//	@Param			slug	path		string	true	"Deployment slug"
//	@Success		200		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/deployments/{slug} [get]
func (h *DeploymentHandler) GetPublicDeployment(c *gin.Context) {
	deployment, err := h.uc.GetPublic(c.Request.Context(), c.Param("slug"))
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, deployment)
}

// UpdateDeploymentStatus godoc
//
//	@Summary		Change a deployment's status
//	@Description	Takes one of the admin's organization's deployments live, back to draft, or closes it
//	@Tags			Admin – Deployments
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		string						true	"Deployment ID"
//	@Param			body	body		object{status=string}		true	"draft, live or closed"
//	@Success		200		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/deployments/{id}/status [patch]
func (h *DeploymentHandler) UpdateDeploymentStatus(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		Status entity.DeploymentStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	deployment, err := h.uc.UpdateStatus(c.Request.Context(), *user.OrganizationID, c.Param("id"), input.Status)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, deployment)
}

// GetAllDeployments godoc
//
//	@Summary		List all deployments
//	@Description	Returns every deployment on the platform, newest first, with its organization's name and its incident types
//	@Tags			Super Admin – Deployments
//	@Produce		json
//	@Security		BearerAuth
//	@Param			organizationId	query		string	false	"Only this organization's deployments"
//	@Success		200				{object}	presenter.Response
//	@Failure		401				{object}	presenter.Response
//	@Failure		403				{object}	presenter.Response
//	@Failure		500				{object}	presenter.Response
//	@Router			/superadmin/deployments [get]
func (h *DeploymentHandler) GetAllDeployments(c *gin.Context) {
	var organizationID *string
	if id := c.Query("organizationId"); id != "" {
		organizationID = &id
	}
	deployments, err := h.uc.ListAll(c.Request.Context(), organizationID)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, deployments)
}
