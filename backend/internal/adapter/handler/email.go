package handler

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/pkg/email"
)

type EmailHandler struct {
	svc    email.Service
	secret string
}

func NewEmailHandler(svc email.Service) *EmailHandler {
	return &EmailHandler{
		svc:    svc,
		secret: os.Getenv("INTERNAL_EMAIL_SECRET"),
	}
}

// Send godoc
//
//	@Summary		Send an email
//	@Description	Sends an email via the configured SMTP provider. Requires a valid X-Internal-Token header.
//	@Tags			Email
//	@Accept			json
//	@Produce		json
//	@Param			X-Internal-Token	header		string								true	"Internal service secret"
//	@Param			body				body		object{to=string,subject=string,body=string,html=string}	true	"Email payload"
//	@Success		200					{object}	presenter.Response
//	@Failure		400					{object}	presenter.Response
//	@Failure		401					{object}	presenter.Response
//	@Failure		500					{object}	presenter.Response
//	@Router			/email/send [post]
func (h *EmailHandler) Send(c *gin.Context) {
	if c.GetHeader("X-Internal-Token") != h.secret || h.secret == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		To      string  `json:"to" binding:"required,email"`
		Subject string  `json:"subject" binding:"required"`
		Body    string  `json:"body" binding:"required"`
		HTML    *string `json:"html"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		presenter.BadRequest(c, err.Error())
		return
	}

	if err := h.svc.Send(input.To, input.Subject, input.Body, input.HTML); err != nil {
		presenter.Error(c, err)
		return
	}

	presenter.OK(c, gin.H{"message": "email sent"})
}
