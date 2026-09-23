// Package analyticsusecase answers aggregate questions about the public
// anonymous reports — the same rows the maps draw. It exists so the chat
// assistant (and anything else) can ask "how many, where, what type, when"
// without writing queries of its own.
package analyticsusecase

import (
	"context"
	"time"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
	"backend/internal/domain/repository"
)

const (
	// DefaultLimit and MaxLimit bound how many buckets come back, so an
	// answer stays small enough to reason over.
	DefaultLimit = 20
	MaxLimit     = 200

	// overviewLimit is how many countries and types the overview lists.
	overviewLimit = 30
)

type UseCase struct {
	reports repository.AnonymousIncidentReportRepository
}

func New(reports repository.AnonymousIncidentReportRepository) *UseCase {
	return &UseCase{reports: reports}
}

// Query runs one aggregate question, after checking the caller asked
// something the repository can answer.
func (uc *UseCase) Query(ctx context.Context, q entity.AnalyticsQuery) (*entity.AnalyticsResult, error) {
	if !q.GroupBy.Valid() {
		return nil, domainerrors.NewBadRequest("groupBy must be one of country, type, day, week, month")
	}
	// An unrecognised period would otherwise be dropped silently and the
	// answer would quietly cover all time.
	if q.Filter.Period != "" && q.Filter.Period.Interval() == "" {
		return nil, domainerrors.NewBadRequest("period must be one of 24h, 7d, 30d, week, month, year")
	}
	if q.Filter.From != nil && q.Filter.To != nil && !q.Filter.To.After(*q.Filter.From) {
		return nil, domainerrors.NewBadRequest("to must be after from")
	}
	switch {
	case q.Limit <= 0:
		q.Limit = DefaultLimit
	case q.Limit > MaxLimit:
		q.Limit = MaxLimit
	}

	result, err := uc.reports.Aggregate(ctx, q)
	if err != nil {
		return nil, err
	}
	result.Applied = appliedFilter(q.Filter)
	return result, nil
}

// Overview describes what data exists: how much, over what window, and the
// exact country and type names Query will match.
func (uc *UseCase) Overview(ctx context.Context) (*entity.DataOverview, error) {
	return uc.reports.Overview(ctx, overviewLimit)
}

// appliedFilter echoes the filter back in the result, so an answer can say
// what it counted rather than leaving the reader to assume.
func appliedFilter(f entity.MapFilter) entity.AppliedFilter {
	applied := entity.AppliedFilter{
		Country: f.Country,
		Type:    f.Category,
		Period:  string(f.Period),
		Query:   f.Query,
	}
	if f.From != nil {
		applied.From = f.From.UTC().Format(time.DateOnly)
	}
	if f.To != nil {
		applied.To = f.To.UTC().Format(time.DateOnly)
	}
	if applied.Period == "" && applied.From == "" && applied.To == "" {
		applied.Period = "all time"
	}
	return applied
}
