package fileusecase

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"strings"
	"testing"

	domainerrors "backend/internal/domain/errors"
)

type fakeStorage struct {
	putKey, putType string
	putErr, getErr  error
	gets            int
}

func (f *fakeStorage) Put(_ context.Context, key, contentType string, _ io.Reader, _ int64) error {
	f.putKey, f.putType = key, contentType
	return f.putErr
}

func (f *fakeStorage) Get(_ context.Context, _ string) (io.ReadCloser, string, int64, error) {
	f.gets++
	if f.getErr != nil {
		return nil, "", 0, f.getErr
	}
	return io.NopCloser(strings.NewReader("pdf")), "application/pdf", 3, nil
}

func TestUpload_StoresUnderRandomKeyWithExtension(t *testing.T) {
	st := &fakeStorage{}
	got, err := New(st, nil).Upload(context.Background(), "Certificate.PDF", 1024, strings.NewReader("x"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.HasSuffix(got.FileKey, ".pdf") || len(got.FileKey) != 36+len(".pdf") {
		t.Errorf("want <uuid>.pdf, got %q", got.FileKey)
	}
	if st.putKey != got.FileKey || st.putType != "application/pdf" {
		t.Errorf("stored %q as %q", st.putKey, st.putType)
	}
}

func TestUpload_Rejects(t *testing.T) {
	cases := map[string]struct {
		name string
		size int64
		want error
	}{
		"too large":    {"a.pdf", MaxUploadBytes + 1, ErrTooLarge},
		"no extension": {"certificate", 10, ErrTypeNotAllowed},
		"html":         {"page.HTML", 10, ErrTypeNotAllowed},
		"svg":          {"logo.svg", 10, ErrTypeNotAllowed},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			st := &fakeStorage{}
			_, err := New(st, nil).Upload(context.Background(), tc.name, tc.size, strings.NewReader("x"))
			if !errors.Is(err, tc.want) {
				t.Fatalf("want %v, got %v", tc.want, err)
			}
			if st.putKey != "" {
				t.Error("nothing should be stored")
			}
		})
	}
}

func TestUpload_StorageFailureIsUnavailable(t *testing.T) {
	st := &fakeStorage{putErr: errors.New("dial tcp: no such host")}
	_, err := New(st, nil).Upload(context.Background(), "a.pdf", 10, strings.NewReader("x"))
	if !errors.Is(err, ErrUnavailable) {
		t.Fatalf("want ErrUnavailable, got %v", err)
	}
}

func TestDownload_StoredFile(t *testing.T) {
	d, err := New(&fakeStorage{}, nil).Download(context.Background(), "reports/abc.pdf", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer d.Body.Close()
	if d.Filename != "abc.pdf" || d.ContentType != "application/pdf" || d.Size != 3 {
		t.Errorf("got %+v", d)
	}
}

func TestDownload_MissingKeyIsNotFound(t *testing.T) {
	st := &fakeStorage{getErr: fmt.Errorf("r2: get: %w", fs.ErrNotExist)}
	_, err := New(st, nil).Download(context.Background(), "gone.pdf", "")
	if !errors.Is(err, domainerrors.ErrNotFound) {
		t.Fatalf("want not found, got %v", err)
	}
}

func TestDownload_ExternalURLs(t *testing.T) {
	cases := map[string]struct {
		key     string
		allowed []string
		ok      bool
	}{
		"allowed host":     {"https://data.example.org/a.csv", []string{"example.org"}, true},
		"wildcard":         {"https://anything.test/a.csv", []string{"*"}, true},
		"other host":       {"https://evil.test/a.csv", []string{"example.org"}, false},
		"suffix lookalike": {"https://notexample.org/a.csv", []string{"example.org"}, false},
		"none configured":  {"https://example.org/a.csv", nil, false},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			st := &fakeStorage{}
			d, err := New(st, tc.allowed).Download(context.Background(), tc.key, "")
			if tc.ok {
				if err != nil || d.RedirectURL != tc.key {
					t.Fatalf("want redirect to %q, got %+v, %v", tc.key, d, err)
				}
			} else if !errors.Is(err, domainerrors.ErrBadRequest) {
				t.Fatalf("want bad request, got %v", err)
			}
			if st.gets != 0 {
				t.Error("external URLs shouldn't hit storage")
			}
		})
	}
}
