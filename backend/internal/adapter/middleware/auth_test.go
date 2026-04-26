package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/domain/entity"
	userusecase "backend/internal/usecase/user"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

type mockSessionRepo struct {
	user *entity.User
	err  error
}

func (m *mockSessionRepo) FindByToken(_ context.Context, _ string) (*entity.Session, error) {
	return nil, nil
}
func (m *mockSessionRepo) FindUserByToken(_ context.Context, _ string) (*entity.User, error) {
	return m.user, m.err
}

func (m *mockSessionRepo) DeleteSession(_ context.Context, _ string) error { return nil }

type mockUserRepo struct{}

func (m *mockUserRepo) FindByID(_ context.Context, _ string) (*entity.User, error)          { return nil, nil }
func (m *mockUserRepo) FindByEmail(_ context.Context, _ string) (*entity.User, error)       { return nil, nil }
func (m *mockUserRepo) FindAll(_ context.Context, _ *entity.UserRole) ([]*entity.User, error) { return nil, nil }
func (m *mockUserRepo) Update(_ context.Context, _ *entity.User) error                      { return nil }
func (m *mockUserRepo) Delete(_ context.Context, _ string) error                             { return nil }

func newUseCase(user *entity.User, sessionErr error) *userusecase.UseCase {
	return userusecase.New(&mockUserRepo{}, &mockSessionRepo{user: user, err: sessionErr})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func newRouter(mws ...gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	for _, mw := range mws {
		r.Use(mw)
	}
	r.GET("/test", func(c *gin.Context) { c.Status(http.StatusOK) })
	return r
}

func jsonError(w *httptest.ResponseRecorder) string {
	var body map[string]string
	_ = json.NewDecoder(w.Body).Decode(&body)
	return body["error"]
}

// ─── Auth ────────────────────────────────────────────────────────────────────

func TestAuth_BearerToken_ValidSession_Returns200(t *testing.T) {
	user := &entity.User{ID: "u1", Role: entity.RoleAdmin}
	uc := newUseCase(user, nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	w := httptest.NewRecorder()

	newRouter(Auth(uc)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}

func TestAuth_CookieToken_ValidSession_Returns200(t *testing.T) {
	user := &entity.User{ID: "u2", Role: entity.RoleWatcher}
	uc := newUseCase(user, nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.AddCookie(&http.Cookie{Name: "better-auth.session_token", Value: "cookie-token"})
	w := httptest.NewRecorder()

	newRouter(Auth(uc)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}

func TestAuth_NoToken_Returns401(t *testing.T) {
	uc := newUseCase(nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()

	newRouter(Auth(uc)).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestAuth_InvalidToken_Returns401(t *testing.T) {
	uc := newUseCase(nil, nil) // session repo returns nil user → unauthorized

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer expired-token")
	w := httptest.NewRecorder()

	newRouter(Auth(uc)).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestAuth_SetsUserInContext(t *testing.T) {
	user := &entity.User{ID: "ctx-user", Role: entity.RoleAdmin}
	uc := newUseCase(user, nil)

	var gotID string
	r := gin.New()
	r.Use(Auth(uc))
	r.GET("/test", func(c *gin.Context) {
		if u := CurrentUser(c); u != nil {
			gotID = u.ID
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("Authorization", "Bearer tok")
	r.ServeHTTP(httptest.NewRecorder(), req)

	if gotID != "ctx-user" {
		t.Errorf("user in context ID = %q, want %q", gotID, "ctx-user")
	}
}

// ─── RequireRole ─────────────────────────────────────────────────────────────

func injectUser(user *entity.User) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(userContextKey, user)
		c.Next()
	}
}

func TestRequireRole_MatchingRole_Allows(t *testing.T) {
	user := &entity.User{ID: "u1", Role: entity.RoleAdmin}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(injectUser(user), RequireRole(entity.RoleAdmin)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}

func TestRequireRole_WrongRole_Returns403(t *testing.T) {
	user := &entity.User{ID: "u2", Role: entity.RoleWatcher}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(injectUser(user), RequireRole(entity.RoleAdmin)).ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

func TestRequireRole_NoUserInContext_Returns401(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(RequireRole(entity.RoleAdmin)).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestRequireRole_MultipleAllowedRoles(t *testing.T) {
	tests := []struct {
		role entity.UserRole
		want int
	}{
		{entity.RoleAdmin, http.StatusOK},
		{entity.RoleSuperAdmin, http.StatusOK},
		{entity.RoleWatcher, http.StatusForbidden},
		{entity.RoleIndependentReporter, http.StatusForbidden},
	}

	for _, tt := range tests {
		user := &entity.User{Role: tt.role}
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		w := httptest.NewRecorder()
		newRouter(injectUser(user), RequireRole(entity.RoleAdmin, entity.RoleSuperAdmin)).ServeHTTP(w, req)
		if w.Code != tt.want {
			t.Errorf("role %q: status = %d, want %d", tt.role, w.Code, tt.want)
		}
	}
}

// ─── RequireOrganization ─────────────────────────────────────────────────────

func TestRequireOrganization_UserWithOrg_Allows(t *testing.T) {
	orgID := "org-1"
	user := &entity.User{ID: "u1", OrganizationID: &orgID}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(injectUser(user), RequireOrganization()).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}

func TestRequireOrganization_UserWithoutOrg_Returns403(t *testing.T) {
	user := &entity.User{ID: "u2", OrganizationID: nil}

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(injectUser(user), RequireOrganization()).ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

func TestRequireOrganization_NoUserInContext_Returns403(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	newRouter(RequireOrganization()).ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", w.Code)
	}
}

// ─── extractToken ────────────────────────────────────────────────────────────

func TestExtractToken_BearerHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Request.Header.Set("Authorization", "Bearer mytoken")

	if got := extractToken(c); got != "mytoken" {
		t.Errorf("extractToken() = %q, want %q", got, "mytoken")
	}
}

func TestExtractToken_Cookie(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Request.AddCookie(&http.Cookie{Name: "better-auth.session_token", Value: "cookietoken"})

	if got := extractToken(c); got != "cookietoken" {
		t.Errorf("extractToken() = %q, want %q", got, "cookietoken")
	}
}

func TestExtractToken_NoCredentials_ReturnsEmpty(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)

	if got := extractToken(c); got != "" {
		t.Errorf("extractToken() = %q, want empty string", got)
	}
}

func TestExtractToken_BearerTakesPrecedenceOverCookie(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Request.Header.Set("Authorization", "Bearer header-token")
	c.Request.AddCookie(&http.Cookie{Name: "better-auth.session_token", Value: "cookie-token"})

	if got := extractToken(c); got != "header-token" {
		t.Errorf("extractToken() = %q, want %q", got, "header-token")
	}
}
