package domainerrors

import "errors"

var (
	ErrNotFound              = errors.New("not found")
	ErrUnauthorized          = errors.New("unauthorized")
	ErrForbidden             = errors.New("forbidden")
	ErrConflict              = errors.New("conflict")
	ErrBadRequest            = errors.New("bad request")
	ErrInternal              = errors.New("internal server error")
	ErrSessionExpired        = errors.New("session expired")
	ErrUserBanned            = errors.New("user is banned")
	ErrOrganizationRequired  = errors.New("organization membership required")
)

type DomainError struct {
	Err     error
	Message string
}

func (e *DomainError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Err.Error()
}

func (e *DomainError) Unwrap() error { return e.Err }

func NewNotFound(msg string) *DomainError {
	return &DomainError{Err: ErrNotFound, Message: msg}
}

func NewUnauthorized(msg string) *DomainError {
	return &DomainError{Err: ErrUnauthorized, Message: msg}
}

func NewForbidden(msg string) *DomainError {
	return &DomainError{Err: ErrForbidden, Message: msg}
}

func NewConflict(msg string) *DomainError {
	return &DomainError{Err: ErrConflict, Message: msg}
}

func NewBadRequest(msg string) *DomainError {
	return &DomainError{Err: ErrBadRequest, Message: msg}
}

func NewInternal(msg string) *DomainError {
	return &DomainError{Err: ErrInternal, Message: msg}
}
