package presenter

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	domainerrors "backend/internal/domain/errors"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Total   *int        `json:"total,omitempty"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{Success: true, Data: data})
}

func OKList(c *gin.Context, data interface{}, total int) {
	c.JSON(http.StatusOK, Response{Success: true, Data: data, Total: &total})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{Success: true, Data: data})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func Error(c *gin.Context, err error) {
	var domainErr *domainerrors.DomainError
	if errors.As(err, &domainErr) {
		switch {
		case errors.Is(domainErr.Err, domainerrors.ErrNotFound):
			c.JSON(http.StatusNotFound, Response{Success: false, Error: domainErr.Error()})
		case errors.Is(domainErr.Err, domainerrors.ErrUnauthorized):
			c.JSON(http.StatusUnauthorized, Response{Success: false, Error: domainErr.Error()})
		case errors.Is(domainErr.Err, domainerrors.ErrForbidden):
			c.JSON(http.StatusForbidden, Response{Success: false, Error: domainErr.Error()})
		case errors.Is(domainErr.Err, domainerrors.ErrConflict):
			c.JSON(http.StatusConflict, Response{Success: false, Error: domainErr.Error()})
		case errors.Is(domainErr.Err, domainerrors.ErrBadRequest):
			c.JSON(http.StatusBadRequest, Response{Success: false, Error: domainErr.Error()})
		default:
			c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "internal server error"})
		}
		return
	}
	c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "internal server error"})
}

func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, Response{Success: false, Error: msg})
}
