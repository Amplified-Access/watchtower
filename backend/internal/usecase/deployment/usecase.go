package deploymentusecase

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

type UseCase struct {
	repo repository.DeploymentRepository
}

func New(repo repository.DeploymentRepository) *UseCase {
	return &UseCase{repo: repo}
}

// ListForOrganization is an admin's own deployments.
func (uc *UseCase) ListForOrganization(ctx context.Context, organizationID string) ([]*entity.Deployment, error) {
	return uc.repo.FindAll(ctx, &organizationID)
}

// CountsForOrganization is how many deployments an organization has, by
// status, for its admin's dashboard.
func (uc *UseCase) CountsForOrganization(ctx context.Context, organizationID string) (entity.DeploymentCounts, error) {
	return uc.repo.CountByStatus(ctx, &organizationID)
}

// ListAll is every deployment on the platform, for the super admin;
// organizationID, when set, narrows it to one organization.
func (uc *UseCase) ListAll(ctx context.Context, organizationID *string) ([]*entity.Deployment, error) {
	return uc.repo.FindAll(ctx, organizationID)
}

// Create checks a new deployment and saves it under the organization, with
// a slug made from its name.
func (uc *UseCase) Create(ctx context.Context, organizationID string, in entity.NewDeployment) (*entity.Deployment, error) {
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, domainerrors.NewBadRequest("name is required")
	}
	typeIDs := uniqueNonEmpty(in.IncidentTypeIDs)
	if len(typeIDs) == 0 {
		return nil, domainerrors.NewBadRequest("choose at least one incident type")
	}
	status := in.Status
	if status == "" {
		status = entity.DeploymentDraft
	}
	if !status.Valid() {
		return nil, domainerrors.NewBadRequest("status must be draft, live or closed")
	}
	if in.StartsAt != nil && in.EndsAt != nil && in.EndsAt.Before(*in.StartsAt) {
		return nil, domainerrors.NewBadRequest("the end date can't be before the start date")
	}

	slug, err := uc.uniqueSlug(ctx, name)
	if err != nil {
		return nil, err
	}
	d := &entity.Deployment{
		OrganizationID: organizationID,
		Name:           name,
		Slug:           slug,
		Description:    trimmedOrNil(in.Description),
		Country:        trimmedOrNil(in.Country),
		Region:         trimmedOrNil(in.Region),
		Status:         status,
		StartsAt:       in.StartsAt,
		EndsAt:         in.EndsAt,
	}
	if err := uc.repo.Create(ctx, d, typeIDs); err != nil {
		return nil, err
	}
	return d, nil
}

// maxSlugTries bounds the -2, -3... suffixes tried before giving up; past
// it, a name is so common that a different one is the better answer.
const maxSlugTries = 50

func (uc *UseCase) uniqueSlug(ctx context.Context, name string) (string, error) {
	base := Slugify(name)
	if base == "" {
		base = "deployment"
	}
	for i := 1; i <= maxSlugTries; i++ {
		slug := base
		if i > 1 {
			slug = fmt.Sprintf("%s-%d", base, i)
		}
		taken, err := uc.repo.SlugExists(ctx, slug)
		if err != nil {
			return "", err
		}
		if !taken {
			return slug, nil
		}
	}
	return "", domainerrors.NewConflict("too many deployments share this name; try another name")
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify makes a URL-safe slug: lowercase ASCII letters and digits joined
// by single hyphens ("Uganda 2026 Elections!" → "uganda-2026-elections").
// Accents are dropped first, not the letters they sit on, so "Élections"
// becomes "elections".
func Slugify(s string) string {
	stripAccents := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	if plain, _, err := transform.String(stripAccents, s); err == nil {
		s = plain
	}
	return strings.Trim(nonSlug.ReplaceAllString(strings.ToLower(s), "-"), "-")
}

func trimmedOrNil(s *string) *string {
	if s == nil {
		return nil
	}
	t := strings.TrimSpace(*s)
	if t == "" {
		return nil
	}
	return &t
}

func uniqueNonEmpty(ids []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id != "" && !seen[id] {
			seen[id] = true
			out = append(out, id)
		}
	}
	return out
}
