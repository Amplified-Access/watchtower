package fileusecase

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net/url"
	"path"
	"strings"

	"github.com/google/uuid"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// MaxUploadBytes caps a single upload. Forms set lower limits of their own
// (10 MB for evidence and registration certificates); datasets need more.
const MaxUploadBytes = 50 << 20

const maxKeyLen = 1024

// Uploads are public, so refuse types a browser would execute if a file
// were ever served inline.
var blockedExtensions = map[string]bool{
	"html": true, "htm": true, "xhtml": true, "svg": true, "js": true, "mjs": true, "cjs": true,
	"exe": true, "bat": true, "cmd": true, "sh": true, "msi": true, "php": true,
}

var (
	// ErrUnavailable means file storage isn't configured or didn't respond.
	ErrUnavailable = errors.New("file storage is unavailable")
	// ErrTooLarge means the upload is over MaxUploadBytes.
	ErrTooLarge = errors.New("file is too large (50 MB max)")
	// ErrTypeNotAllowed means the file has no extension or a blocked one.
	ErrTypeNotAllowed = errors.New("this file type isn't allowed")
)

// Storage keeps uploaded files by key (Cloudflare R2 in production).
type Storage interface {
	Put(ctx context.Context, key, contentType string, body io.Reader, size int64) error
	// Get returns size -1 when it's unknown, and an error wrapping
	// fs.ErrNotExist when key isn't stored.
	Get(ctx context.Context, key string) (body io.ReadCloser, contentType string, size int64, err error)
}

// Download is either a stored file to stream (Body set, caller closes it)
// or an external URL to redirect to.
type Download struct {
	RedirectURL string
	Body        io.ReadCloser
	ContentType string
	Size        int64
	Filename    string
}

type UseCase struct {
	storage Storage
	// allowedDomains are the hosts a file key may point at when it's a full
	// URL rather than a stored key. "*" allows any host.
	allowedDomains []string
}

func New(storage Storage, allowedDomains []string) *UseCase {
	return &UseCase{storage: storage, allowedDomains: allowedDomains}
}

// Upload stores a file under a new random key and returns the key.
func (uc *UseCase) Upload(ctx context.Context, filename string, size int64, body io.Reader) (*entity.UploadedFile, error) {
	if size > MaxUploadBytes {
		return nil, ErrTooLarge
	}
	ext := strings.ToLower(strings.TrimPrefix(path.Ext(filename), "."))
	if ext == "" || blockedExtensions[ext] {
		return nil, ErrTypeNotAllowed
	}

	contentType := mime.TypeByExtension("." + ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	key := uuid.NewString() + "." + ext
	if err := uc.storage.Put(ctx, key, contentType, body, size); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}
	return &entity.UploadedFile{FileKey: key}, nil
}

// Download opens the file stored under key, to be saved as filename. Older
// records hold a full URL instead of a key; those redirect when the host is
// allowed.
func (uc *UseCase) Download(ctx context.Context, key, filename string) (*Download, error) {
	if key == "" {
		return nil, domainerrors.NewBadRequest("file key is required")
	}
	if len(key) > maxKeyLen {
		return nil, domainerrors.NewBadRequest("file key is too long")
	}

	if strings.HasPrefix(key, "https://") || strings.HasPrefix(key, "http://") {
		u, err := url.Parse(key)
		if err != nil || u.Hostname() == "" {
			return nil, domainerrors.NewBadRequest("invalid URL")
		}
		if !uc.hostAllowed(u.Hostname()) {
			return nil, domainerrors.NewBadRequest("external domain not permitted")
		}
		return &Download{RedirectURL: key}, nil
	}

	body, contentType, size, err := uc.storage.Get(ctx, key)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, domainerrors.NewNotFound("file not found")
	}
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUnavailable, err)
	}

	if filename == "" {
		filename = path.Base(key)
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	return &Download{Body: body, ContentType: contentType, Size: size, Filename: filename}, nil
}

func (uc *UseCase) hostAllowed(host string) bool {
	for _, d := range uc.allowedDomains {
		if d == "*" || host == d || strings.HasSuffix(host, "."+d) {
			return true
		}
	}
	return false
}
