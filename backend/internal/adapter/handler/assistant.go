package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	assistantusecase "backend/internal/usecase/assistant"
)

type AssistantHandler struct {
	uc *assistantusecase.UseCase
}

func NewAssistantHandler(uc *assistantusecase.UseCase) *AssistantHandler {
	return &AssistantHandler{uc: uc}
}

// SearchKnowledge godoc
//
//	@Summary		Search the assistant's knowledge base
//	@Description	Returns up to 4 knowledge-base passages similar to the question (cosine similarity above 0.5), for the chat assistant.
//	@Tags			Assistant
//	@Accept			json
//	@Produce		json
//	@Param			body	body		object{question=string}	true	"Question"
//	@Success		200		{object}	presenter.Response{data=[]entity.KnowledgeMatch}
//	@Failure		400		{object}	presenter.Response
//	@Failure		503		{object}	presenter.Response
//	@Router			/assistant/knowledge/search [post]
func (h *AssistantHandler) SearchKnowledge(c *gin.Context) {
	var req struct {
		Question string `json:"question" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	var matches []*entity.KnowledgeMatch
	matches, err := h.uc.SearchKnowledge(c.Request.Context(), req.Question)
	if errors.Is(err, assistantusecase.ErrUnavailable) {
		slog.Error("knowledge search unavailable", slog.String("error", err.Error()))
		c.JSON(http.StatusServiceUnavailable, presenter.Response{Success: false, Error: assistantusecase.ErrUnavailable.Error()})
		return
	}
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, matches)
}
