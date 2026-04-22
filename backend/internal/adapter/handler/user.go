package handler

import (
	"github.com/gin-gonic/gin"

	"backend/internal/adapter/middleware"
	"backend/internal/adapter/presenter"
	userusecase "backend/internal/usecase/user"
)

type UserHandler struct {
	uc *userusecase.UseCase
}

func NewUserHandler(uc *userusecase.UseCase) *UserHandler {
	return &UserHandler{uc: uc}
}

func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user == nil {
		presenter.BadRequest(c, "user not found in context")
		return
	}
	presenter.OK(c, user)
}

func (h *UserHandler) GetAllWatchers(c *gin.Context) {
	users, err := h.uc.GetAllByRole(c.Request.Context(), "watcher")
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, users)
}

func (h *UserHandler) GetAllAdmins(c *gin.Context) {
	users, err := h.uc.GetAllByRole(c.Request.Context(), "admin")
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, users)
}
