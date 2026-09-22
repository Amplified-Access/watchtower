package handler

import (
	"errors"
	"log/slog"
	"mime"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	fileusecase "backend/internal/usecase/file"
)

// Files move slower than the server's default 10s read / 30s write
// timeouts allow on a mobile connection.
const fileTransferTimeout = 5 * time.Minute

type FileHandler struct {
	uc *fileusecase.UseCase
}

func NewFileHandler(uc *fileusecase.UseCase) *FileHandler {
	return &FileHandler{uc: uc}
}

// Upload godoc
//
//	@Summary		Upload a file
//	@Description	Stores a file (50 MB max; no HTML, SVG, script or executable types) and returns the key to save on the record that uses it.
//	@Tags			Files
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			file	formData	file	true	"File to store"
//	@Success		201		{object}	presenter.Response{data=entity.UploadedFile}
//	@Failure		400		{object}	presenter.Response
//	@Failure		413		{object}	presenter.Response
//	@Failure		415		{object}	presenter.Response
//	@Failure		503		{object}	presenter.Response
//	@Router			/files [post]
func (h *FileHandler) Upload(c *gin.Context) {
	_ = http.NewResponseController(c.Writer).SetReadDeadline(time.Now().Add(fileTransferTimeout))
	// Leave room for the multipart headers around the file itself.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, fileusecase.MaxUploadBytes+1<<20)

	header, err := c.FormFile("file")
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			h.fail(c, http.StatusRequestEntityTooLarge, fileusecase.ErrTooLarge)
			return
		}
		presenter.BadRequest(c, "file is required")
		return
	}
	file, err := header.Open()
	if err != nil {
		presenter.BadRequest(c, "file could not be read")
		return
	}
	defer file.Close()

	var uploaded *entity.UploadedFile
	uploaded, err = h.uc.Upload(c.Request.Context(), header.Filename, header.Size, file)
	switch {
	case errors.Is(err, fileusecase.ErrTooLarge):
		h.fail(c, http.StatusRequestEntityTooLarge, err)
	case errors.Is(err, fileusecase.ErrTypeNotAllowed):
		h.fail(c, http.StatusUnsupportedMediaType, err)
	case errors.Is(err, fileusecase.ErrUnavailable):
		slog.Error("file upload failed", slog.String("error", err.Error()))
		h.fail(c, http.StatusServiceUnavailable, fileusecase.ErrUnavailable)
	case err != nil:
		presenter.Error(c, err)
	default:
		presenter.Created(c, uploaded)
	}
}

// Download godoc
//
//	@Summary		Download a file
//	@Description	Streams a stored file as an attachment. Keys that are full URLs redirect, if the host is in ALLOWED_EXTERNAL_DOMAINS.
//	@Tags			Files
//	@Produce		octet-stream
//	@Param			fileKey		query		string	true	"Stored file key"
//	@Param			filename	query		string	false	"Name to save the file as (defaults to the key)"
//	@Success		200			{file}		file
//	@Success		302
//	@Failure		400			{object}	presenter.Response
//	@Failure		404			{object}	presenter.Response
//	@Failure		503			{object}	presenter.Response
//	@Router			/files/download [get]
func (h *FileHandler) Download(c *gin.Context) {
	download, err := h.uc.Download(c.Request.Context(), c.Query("fileKey"), c.Query("filename"))
	if errors.Is(err, fileusecase.ErrUnavailable) {
		slog.Error("file download failed", slog.String("error", err.Error()))
		h.fail(c, http.StatusServiceUnavailable, fileusecase.ErrUnavailable)
		return
	}
	if err != nil {
		presenter.Error(c, err)
		return
	}
	if download.RedirectURL != "" {
		c.Redirect(http.StatusFound, download.RedirectURL)
		return
	}
	defer download.Body.Close()

	_ = http.NewResponseController(c.Writer).SetWriteDeadline(time.Now().Add(fileTransferTimeout))
	c.DataFromReader(http.StatusOK, download.Size, download.ContentType, download.Body, map[string]string{
		"Content-Disposition":    mime.FormatMediaType("attachment", map[string]string{"filename": download.Filename}),
		"X-Content-Type-Options": "nosniff",
	})
}

func (h *FileHandler) fail(c *gin.Context, status int, err error) {
	c.JSON(status, presenter.Response{Success: false, Error: err.Error()})
}
