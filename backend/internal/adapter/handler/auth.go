package handler

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	authusecase "backend/internal/usecase/auth"
)

const sessionCookieName = "better-auth.session_token"
const sessionMaxAge = 60 * 60 * 24 * 7 // 7 days

type AuthHandler struct {
	uc *authusecase.UseCase
}

func NewAuthHandler(uc *authusecase.UseCase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	session, user, err := h.uc.Login(
		c.Request.Context(),
		req.Email, req.Password,
		c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		presenter.Error(c, err)
		return
	}

	setSessionCookie(c, session.Token)
	presenter.OK(c, gin.H{"user": user})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Name     string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	session, user, err := h.uc.Register(
		c.Request.Context(),
		req.Email, req.Password, req.Name,
		c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		presenter.Error(c, err)
		return
	}

	setSessionCookie(c, session.Token)
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"user": user}})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	token, err := c.Cookie(sessionCookieName)
	if err == nil && token != "" {
		_ = h.uc.Logout(c.Request.Context(), token)
	}
	clearSessionCookie(c)
	presenter.OK(c, nil)
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Always return success to avoid email enumeration, but log any real errors.
	if err := h.uc.ForgotPassword(c.Request.Context(), req.Email, frontendURL); err != nil {
		slog.Error("forgot-password failed", slog.String("error", err.Error()))
	}
	presenter.OK(c, gin.H{"message": "If that email exists, a reset link has been sent."})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	if err := h.uc.ResetPassword(c.Request.Context(), req.Token, req.Password); err != nil {
		presenter.Error(c, err)
		return
	}

	presenter.OK(c, gin.H{"message": "Password reset successfully."})
}


func setSessionCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookieName, token, sessionMaxAge, "/", "", os.Getenv("ENV") == "production", true)
}

func clearSessionCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(sessionCookieName, "", -1, "/", "", os.Getenv("ENV") == "production", true)
}

