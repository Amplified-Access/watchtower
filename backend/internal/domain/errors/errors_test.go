package domainerrors

import (
	"errors"
	"testing"
)

func TestDomainError_Error_WithMessage(t *testing.T) {
	err := &DomainError{Err: ErrNotFound, Message: "user not found"}
	if got := err.Error(); got != "user not found" {
		t.Errorf("Error() = %q, want %q", got, "user not found")
	}
}

func TestDomainError_Error_NoMessage_FallsBackToSentinel(t *testing.T) {
	err := &DomainError{Err: ErrUnauthorized}
	if got := err.Error(); got != ErrUnauthorized.Error() {
		t.Errorf("Error() = %q, want %q", got, ErrUnauthorized.Error())
	}
}

func TestDomainError_Unwrap_MatchesSentinel(t *testing.T) {
	err := &DomainError{Err: ErrNotFound, Message: "custom message"}
	if !errors.Is(err, ErrNotFound) {
		t.Error("errors.Is should unwrap and match the wrapped sentinel error")
	}
}

func TestDomainError_Unwrap_DoesNotMatchOtherSentinels(t *testing.T) {
	err := &DomainError{Err: ErrNotFound}
	if errors.Is(err, ErrUnauthorized) {
		t.Error("errors.Is should not match a different sentinel")
	}
}

func TestConstructors(t *testing.T) {
	tests := []struct {
		name     string
		err      *DomainError
		sentinel error
		msg      string
	}{
		{"NewNotFound", NewNotFound("thing not found"), ErrNotFound, "thing not found"},
		{"NewUnauthorized", NewUnauthorized("bad token"), ErrUnauthorized, "bad token"},
		{"NewForbidden", NewForbidden("no access"), ErrForbidden, "no access"},
		{"NewConflict", NewConflict("already exists"), ErrConflict, "already exists"},
		{"NewBadRequest", NewBadRequest("invalid input"), ErrBadRequest, "invalid input"},
		{"NewInternal", NewInternal("db failure"), ErrInternal, "db failure"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.Error() != tt.msg {
				t.Errorf("Error() = %q, want %q", tt.err.Error(), tt.msg)
			}
			if !errors.Is(tt.err, tt.sentinel) {
				t.Errorf("errors.Is(%v, %v) = false, want true", tt.err, tt.sentinel)
			}
		})
	}
}

func TestConstructors_EmptyMessageUsesWrappedError(t *testing.T) {
	err := NewNotFound("")
	if err.Error() != ErrNotFound.Error() {
		t.Errorf("Error() = %q, want %q", err.Error(), ErrNotFound.Error())
	}
}
