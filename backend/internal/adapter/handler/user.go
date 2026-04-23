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

// GetCurrentUser godoc
//
//	@Summary		Get current user
//	@Description	Returns the authenticated user's profile
//	@Tags			Users
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		400	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Router			/me [get]
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user == nil {
		presenter.BadRequest(c, "user not found in context")
		return
	}
	presenter.OK(c, user)
}

// GetAllWatchers godoc
//
//	@Summary		List watchers
//	@Description	Returns all users with the watcher role. Accessible to admins and super admins.
//	@Tags			Users
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/admin/watchers [get]
func (h *UserHandler) GetAllWatchers(c *gin.Context) {
	users, err := h.uc.GetAllByRole(c.Request.Context(), "watcher")
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, users)
}

// GetAllAdmins godoc
//
//	@Summary		List admins
//	@Description	Returns all users with the admin role (super admin only)
//	@Tags			Super Admin – Users
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	presenter.Response
//	@Failure		401	{object}	presenter.Response
//	@Failure		403	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/superadmin/users/admins [get]
func (h *UserHandler) GetAllAdmins(c *gin.Context) {
	users, err := h.uc.GetAllByRole(c.Request.Context(), "admin")
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, users)
}
