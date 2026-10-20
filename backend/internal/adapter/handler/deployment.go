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
