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

func (h *InsightHandler) GetPublicInsightBySlug(c *gin.Context) {
	slug := c.Param("slug")
	insight, err := h.uc.GetPublicInsightBySlug(c.Request.Context(), slug)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, insight)
}

func (h *InsightHandler) GetTags(c *gin.Context) {
	tags, err := h.uc.GetTags(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, tags)
}

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
