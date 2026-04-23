package handler

import (
	"strings"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	insightusecase "backend/internal/usecase/insight"
)

type InsightHandler struct {
	uc *insightusecase.UseCase
}

func NewInsightHandler(uc *insightusecase.UseCase) *InsightHandler {
	return &InsightHandler{uc: uc}
}

// GetPublicInsights godoc
//
//	@Summary		List public insights
//	@Description	Returns a paginated list of published insights, optionally filtered by tags
//	@Tags			Insights
//	@Produce		json
//	@Param			limit		query		int		false	"Page size (default 20, max 100)"
//	@Param			offset		query		int		false	"Pagination offset"
//	@Param			search		query		string	false	"Search term"
//	@Param			sort		query		string	false	"Sort field (default: created_at)"
//	@Param			sortOrder	query		string	false	"Sort direction: asc or desc"
//	@Param			tags		query		string	false	"Comma-separated list of tag slugs to filter by"
//	@Success		200			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/insights [get]
func (h *InsightHandler) GetPublicInsights(c *gin.Context) {
	params := parseListParams(c)
	var tags []string
	if t := c.Query("tags"); t != "" {
		tags = strings.Split(t, ",")
	}
	insights, total, err := h.uc.GetPublicInsights(c.Request.Context(), params, tags)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OKList(c, insights, total)
}

// GetPublicInsightBySlug godoc
//
//	@Summary		Get insight by slug
//	@Description	Returns a single published insight by its URL slug
//	@Tags			Insights
//	@Produce		json
//	@Param			slug	path		string	true	"Insight slug"
//	@Success		200		{object}	presenter.Response
//	@Failure		404		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/insights/{slug} [get]
func (h *InsightHandler) GetPublicInsightBySlug(c *gin.Context) {
	slug := c.Param("slug")
	insight, err := h.uc.GetPublicInsightBySlug(c.Request.Context(), slug)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, insight)
}

// GetTags godoc
//
//	@Summary		List insight tags
//	@Description	Returns all available insight tags
//	@Tags			Insights
//	@Produce		json
//	@Success		200	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/insights/tags [get]
func (h *InsightHandler) GetTags(c *gin.Context) {
	tags, err := h.uc.GetTags(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, tags)
}

// CreateInsight godoc
//
//	@Summary		Create insight
//	@Description	Publishes a new insight article (admin only)
//	@Tags			Admin – Insights
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{title=string,slug=string,description=string,content=object,imageUrl=string,imageAlt=string,status=string,tagIds=[]string}	true	"Insight payload"
//	@Success		201		{object}	presenter.Response
//	@Failure		400		{object}	presenter.Response
//	@Failure		401		{object}	presenter.Response
//	@Failure		403		{object}	presenter.Response
//	@Failure		500		{object}	presenter.Response
//	@Router			/admin/insights [post]
func (h *InsightHandler) CreateInsight(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var input struct {
		Title       string                 `json:"title" binding:"required"`
		Slug        string                 `json:"slug" binding:"required"`
		Description string                 `json:"description" binding:"required"`
		Content     map[string]interface{} `json:"content"`
		ImageURL    *string                `json:"imageUrl"`
		ImageAlt    *string                `json:"imageAlt"`
		Status      entity.InsightStatus   `json:"status"`
		TagIDs      []string               `json:"tagIds"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}
	if input.Status == "" {
		input.Status = entity.InsightDraft
	}
	tags := make([]entity.InsightTag, len(input.TagIDs))
	for i, id := range input.TagIDs {
		tags[i] = entity.InsightTag{ID: id}
	}
	insight := &entity.Insight{
		Title:          input.Title,
		Slug:           input.Slug,
		Description:    input.Description,
		Content:        input.Content,
		AuthorID:       user.ID,
		OrganizationID: user.OrganizationID,
		ImageURL:       input.ImageURL,
		ImageAlt:       input.ImageAlt,
		Status:         input.Status,
		Tags:           tags,
	}
	if err := h.uc.CreateInsight(c.Request.Context(), insight); err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.Created(c, insight)
}
