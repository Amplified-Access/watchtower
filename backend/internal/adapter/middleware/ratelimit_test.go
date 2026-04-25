package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/domain/entity"
)

// ─── Key strategy functions ──────────────────────────────────────────────────

func ginCtxWithIP(ip string) *gin.Context {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = ip + ":1234"
	c.Request = req
	return c
}

func TestPublicIPKey(t *testing.T) {
	c := ginCtxWithIP("10.0.0.1")
	got := PublicIPKey(c)
	want := "pub:" + c.ClientIP()
	if got != want {
		t.Errorf("PublicIPKey() = %q, want %q", got, want)
	}
}

func TestStrictIPKey(t *testing.T) {
	c := ginCtxWithIP("192.168.1.5")
	got := StrictIPKey(c)
	want := "strict:" + c.ClientIP()
	if got != want {
		t.Errorf("StrictIPKey() = %q, want %q", got, want)
	}
}

func TestAuthUserKey_WithAuthenticatedUser(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Request.RemoteAddr = "1.2.3.4:80"
	user := &entity.User{ID: "user-42"}
	c.Set(userContextKey, user)

	got := AuthUserKey(c)
	if got != "user:user-42" {
		t.Errorf("AuthUserKey() = %q, want %q", got, "user:user-42")
	}
}

func TestAuthUserKey_Unauthenticated_FallsBackToIP(t *testing.T) {
	c := ginCtxWithIP("5.6.7.8")
	got := AuthUserKey(c)
	want := "anon:" + c.ClientIP()
	if got != want {
		t.Errorf("AuthUserKey() = %q, want %q", got, want)
	}
}

func TestPublicIPKey_DifferentClients_ProduceDifferentKeys(t *testing.T) {
	c1 := ginCtxWithIP("1.1.1.1")
	c2 := ginCtxWithIP("2.2.2.2")
	if PublicIPKey(c1) == PublicIPKey(c2) {
		t.Error("different client IPs should produce different rate limit keys")
	}
}

func TestKeyStrategies_PrefixesAreDistinct(t *testing.T) {
	c := ginCtxWithIP("9.9.9.9")
	pub := PublicIPKey(c)
	strict := StrictIPKey(c)
	if pub == strict {
		t.Errorf("PublicIPKey and StrictIPKey returned the same key for the same IP: %q", pub)
	}
}
