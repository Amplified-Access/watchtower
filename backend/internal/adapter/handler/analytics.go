package handler

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
	analyticsusecase "backend/internal/usecase/analytics"
)

type AnalyticsHandler struct {
	uc *analyticsusecase.UseCase
}

func NewAnalyticsHandler(uc *analyticsusecase.UseCase) *AnalyticsHandler {
	return &AnalyticsHandler{uc: uc}
}

// QueryIncidents godoc
//
//	@Summary		Aggregate public incident reports
//	@Description	Counts reports, injuries and fatalities for a filter, optionally split by country, incident type, day, week or month. Covers the same anonymous reports as the public maps. Built for the chat assistant's data questions.
//	@Tags			Analytics
//	@Produce		json
//	@Param			groupBy		query		string	false	"Split by: country, type, day, week or month. Omit for totals only"
//	@Param			category	query		string	false	"Incident type name"
//	@Param			country		query		string	false	"Country name"
//	@Param			period		query		string	false	"Relative window: 24h, 7d, 30d, week, month or year"
//	@Param			from		query		string	false	"Start date (YYYY-MM-DD), instead of period"
//	@Param			to			query		string	false	"End date, inclusive (YYYY-MM-DD), instead of period"
//	@Param			q			query		string	false	"Search place names and descriptions"
//	@Param			limit		query		int		false	"Maximum buckets (default 20, max 200)"
//	@Success		200			{object}	presenter.Response{data=entity.AnalyticsResult}
//	@Failure		400			{object}	presenter.Response
//	@Failure		500			{object}	presenter.Response
//	@Router			/analytics/incidents [get]
func (h *AnalyticsHandler) QueryIncidents(c *gin.Context) {
	filter, ok := parseMapFilter(c)
	if !ok {
		return
	}

	query := entity.AnalyticsQuery{
		Filter:  filter,
		GroupBy: entity.AnalyticsGroupBy(strings.TrimSpace(c.Query("groupBy"))),
	}
	if raw := c.Query("limit"); raw != "" {
		limit, err := strconv.Atoi(raw)
		if err != nil {
			presenter.BadRequest(c, "limit must be a number")
			return
		}
		query.Limit = limit
	}

	result, err := h.uc.Query(c.Request.Context(), query)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, result)
}

// GetOverview godoc
//
//	@Summary		What report data exists
//	@Description	Total public reports, the window they cover, and the country and incident type names available to filter by. Meant to be read before querying, so a question is asked with names that exist.
//	@Tags			Analytics
//	@Produce		json
//	@Success		200	{object}	presenter.Response{data=entity.DataOverview}
//	@Failure		500	{object}	presenter.Response
//	@Router			/analytics/overview [get]
func (h *AnalyticsHandler) GetOverview(c *gin.Context) {
	overview, err := h.uc.Overview(c.Request.Context())
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, overview)
}
