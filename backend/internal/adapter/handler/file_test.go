package handler

import (
	"bytes"
	"context"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	fileusecase "backend/internal/usecase/file"
)

type memStorage struct {
	files map[string]string
	err   error
}

func (m *memStorage) Put(_ context.Context, key, _ string, body io.Reader, _ int64) error {
	if m.err != nil {
		return m.err
	}
	b, _ := io.ReadAll(body)
	m.files[key] = string(b)
	return nil
}

func (m *memStorage) Get(_ context.Context, key string) (io.ReadCloser, string, int64, error) {
	return io.NopCloser(strings.NewReader(m.files[key])), "application/pdf", int64(len(m.files[key])), nil
}

func fileRouter(st *memStorage) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := NewFileHandler(fileusecase.New(st, nil))
	r := gin.New()
	r.POST("/files", h.Upload)
	r.GET("/files/download", h.Download)
	return r
}

func uploadRequest(t *testing.T, filename, content string) *http.Request {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("file", filename)
	if err != nil {
		t.Fatal(err)
	}
	part.Write([]byte(content))
	w.Close()
	req := httptest.NewRequest(http.MethodPost, "/files", &body)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req
}

func TestFileHandler_UploadThenDownload(t *testing.T) {
	st := &memStorage{files: map[string]string{}}
	r := fileRouter(st)

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, uploadRequest(t, "cert.pdf", "%PDF-1.4"))
	if rec.Code != http.StatusCreated {
		t.Fatalf("upload: want 201, got %d: %s", rec.Code, rec.Body)
	}
	var key string
	for k := range st.files {
		key = k
	}
	if !strings.Contains(rec.Body.String(), `"fileKey":"`+key+`"`) {
		t.Fatalf("response should carry the stored key %q: %s", key, rec.Body)
	}

	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/files/download?fileKey="+key+"&filename=Acme+certificate.pdf", nil))
	if rec.Code != http.StatusOK || rec.Body.String() != "%PDF-1.4" {
		t.Fatalf("download: got %d %q", rec.Code, rec.Body)
	}
	if got := rec.Header().Get("Content-Disposition"); got != `attachment; filename="Acme certificate.pdf"` {
		t.Errorf("Content-Disposition = %q", got)
	}
}

func TestFileHandler_UploadErrors(t *testing.T) {
	cases := map[string]struct {
		req  func(t *testing.T) *http.Request
		st   *memStorage
		want int
	}{
		"no file": {func(t *testing.T) *http.Request {
			return httptest.NewRequest(http.MethodPost, "/files", nil)
		}, &memStorage{files: map[string]string{}}, http.StatusBadRequest},
		"blocked type": {func(t *testing.T) *http.Request {
			return uploadRequest(t, "x.html", "<script>")
		}, &memStorage{files: map[string]string{}}, http.StatusUnsupportedMediaType},
		"storage down": {func(t *testing.T) *http.Request {
			return uploadRequest(t, "a.pdf", "x")
		}, &memStorage{err: errors.New("no such host")}, http.StatusServiceUnavailable},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			fileRouter(tc.st).ServeHTTP(rec, tc.req(t))
			if rec.Code != tc.want {
				t.Fatalf("want %d, got %d: %s", tc.want, rec.Code, rec.Body)
			}
		})
	}
}
