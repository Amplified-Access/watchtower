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

func (h *OrganizationHandler) GetAll(c *gin.Context) {
	params := parseListParams(c)
	orgs, total, err := h.uc.GetAll(c.Request.Context(), params)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, orgs, total)
}

func (h *OrganizationHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	org, err := h.uc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, org)
}

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

func (h *OrganizationHandler) GetApplications(c *gin.Context) {
	apps, err := h.uc.GetApplications(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, apps)
}

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
		Limit:     limit,
		Offset:    offset,
		Search:    c.Query("search"),
		Sort:      c.DefaultQuery("sort", "created_at"),
		SortOrder: c.DefaultQuery("sortOrder", "desc"),
	}
}
