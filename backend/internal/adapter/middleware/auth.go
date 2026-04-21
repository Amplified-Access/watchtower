package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"backend/internal/domain/entity"
	userusecase "backend/internal/usecase/user"
)

const userContextKey = "currentUser"

func Auth(uc *userusecase.UseCase) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authentication token"})
			c.Abort()
			return
		}

		user, err := uc.GetCurrentUser(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired session"})
			c.Abort()
			return
		}

		c.Set(userContextKey, user)
		c.Next()
	}
}

func RequireRole(roles ...entity.UserRole) gin.HandlerFunc {
	roleSet := make(map[entity.UserRole]bool, len(roles))
	for _, r := range roles {
		roleSet[r] = true
	}
	return func(c *gin.Context) {
		user := CurrentUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
			c.Abort()
			return
		}
		if !roleSet[user.Role] {
			c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireOrganization() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := CurrentUser(c)
		if user == nil || user.OrganizationID == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "organization membership required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func CurrentUser(c *gin.Context) *entity.User {
	val, exists := c.Get(userContextKey)
	if !exists {
		return nil
	}
	user, _ := val.(*entity.User)
	return user
}

func extractToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	// Better Auth cookie fallback
	if cookie, err := c.Cookie("better-auth.session_token"); err == nil {
		return cookie
	}
	return ""
}
