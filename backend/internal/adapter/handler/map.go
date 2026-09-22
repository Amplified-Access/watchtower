package handler

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"backend/internal/adapter/presenter"
	"backend/internal/domain/entity"
)

// parseMapFilter reads the query parameters shared by the map endpoints.
// Dates are whole days in UTC; "to" is inclusive, so it's stored as the start
// of the following day.
func parseMapFilter(c *gin.Context) (entity.MapFilter, bool) {
	f := entity.MapFilter{
		Category: strings.TrimSpace(c.Query("category")),
		Country:  strings.TrimSpace(c.Query("country")),
		Period:   entity.MapPeriod(strings.TrimSpace(c.Query("period"))),
		Query:    c.Query("q"),
	}
	for _, id := range strings.Split(c.Query("excludeTypes"), ",") {
		if id = strings.TrimSpace(id); id != "" {
			f.ExcludeTypeIDs = append(f.ExcludeTypeIDs, id)
		}
	}
	if raw := c.Query("from"); raw != "" {
		t, err := time.Parse(time.DateOnly, raw)
		if err != nil {
			presenter.BadRequest(c, "from must be a date (YYYY-MM-DD)")
			return f, false
		}
		f.From = &t
	}
	if raw := c.Query("to"); raw != "" {
		t, err := time.Parse(time.DateOnly, raw)
		if err != nil {
			presenter.BadRequest(c, "to must be a date (YYYY-MM-DD)")
			return f, false
		}
		end := t.AddDate(0, 0, 1)
		f.To = &end
	}
	return f, true
}

// GetMapPoints godoc
//
//	@Summary		Map points (GeoJSON)
//	@Description	Public anonymous reports as a GeoJSON FeatureCollection for the maps, with a bbox. Features carry only an id, place name, country and date; fetch /map/reports/{id} for the rest.
//	@Tags			Maps
//	@Produce		json
//	@Param			category		query		string	false	"Incident type name"
//	@Param			excludeTypes	query		string	false	"Comma-separated incident type IDs to leave out"
//	@Param			country			query		string	false	"Country name"
//	@Param			period			query		string	false	"Relative window: 24h, 7d, 30d, week, month or year"
//	@Param			from			query		string	false	"Start date (YYYY-MM-DD), instead of period"
//	@Param			to				query		string	false	"End date, inclusive (YYYY-MM-DD), instead of period"
//	@Param			q				query		string	false	"Search place names and descriptions"
//	@Success		200				{object}	presenter.Response{data=entity.MapFeatureCollection}
//	@Failure		400				{object}	presenter.Response
//	@Failure		500				{object}	presenter.Response
//	@Router			/map/points [get]
func (h *IncidentHandler) GetMapPoints(c *gin.Context) {
	f, ok := parseMapFilter(c)
	if !ok {
		return
	}
	fc, err := h.uc.GetMapPoints(c.Request.Context(), f)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, fc)
}

// GetMapSummary godoc
//
//	@Summary		Map summary
//	@Description	Totals, countries and incident types for the reports a map would show, with the same filters as /map/points.
//	@Tags			Maps
//	@Produce		json
//	@Param			category		query		string	false	"Incident type name"
//	@Param			excludeTypes	query		string	false	"Comma-separated incident type IDs to leave out"
//	@Param			country			query		string	false	"Country name"
//	@Param			period			query		string	false	"Relative window: 24h, 7d, 30d, week, month or year"
//	@Param			from			query		string	false	"Start date (YYYY-MM-DD), instead of period"
//	@Param			to				query		string	false	"End date, inclusive (YYYY-MM-DD), instead of period"
//	@Param			q				query		string	false	"Search place names and descriptions"
//	@Success		200				{object}	presenter.Response{data=entity.MapSummary}
//	@Failure		400				{object}	presenter.Response
//	@Failure		500				{object}	presenter.Response
//	@Router			/map/summary [get]
func (h *IncidentHandler) GetMapSummary(c *gin.Context) {
	f, ok := parseMapFilter(c)
	if !ok {
		return
	}
	summary, err := h.uc.GetMapSummary(c.Request.Context(), f)
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, summary)
}

// GetMapReport godoc
//
//	@Summary		Map report details
//	@Description	One report's public details (place, description, injuries, fatalities) for a marker popup. Evidence and audio keys are not included.
//	@Tags			Maps
//	@Produce		json
//	@Param			id	path		string	true	"Report ID"
//	@Success		200	{object}	presenter.Response{data=entity.MapReportDetail}
//	@Failure		404	{object}	presenter.Response
//	@Failure		500	{object}	presenter.Response
//	@Router			/map/reports/{id} [get]
func (h *IncidentHandler) GetMapReport(c *gin.Context) {
	detail, err := h.uc.GetMapReport(c.Request.Context(), c.Param("id"))
	if err != nil {
		presenter.Error(c, err)
		return
	}
	presenter.OK(c, detail)
}
