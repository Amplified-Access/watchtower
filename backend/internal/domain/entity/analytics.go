package entity

import "time"

// AnalyticsGroupBy is the dimension an aggregate query groups by. The set is
// closed: each value maps to a fixed SQL expression in the repository, so a
// caller (including the chat assistant) can never widen the query.
type AnalyticsGroupBy string

const (
	// GroupByNone returns totals only.
	GroupByNone    AnalyticsGroupBy = ""
	GroupByCountry AnalyticsGroupBy = "country"
	GroupByType    AnalyticsGroupBy = "type"
	GroupByDay     AnalyticsGroupBy = "day"
	GroupByWeek    AnalyticsGroupBy = "week"
	GroupByMonth   AnalyticsGroupBy = "month"
)

// Valid reports whether g is one of the supported dimensions.
func (g AnalyticsGroupBy) Valid() bool {
	switch g {
	case GroupByNone, GroupByCountry, GroupByType, GroupByDay, GroupByWeek, GroupByMonth:
		return true
	}
	return false
}

// OverTime reports whether the dimension is a time bucket, which is ordered
// oldest first so a trend reads left to right.
func (g AnalyticsGroupBy) OverTime() bool {
	return g == GroupByDay || g == GroupByWeek || g == GroupByMonth
}

// AnalyticsQuery is one aggregate question about the public reports.
type AnalyticsQuery struct {
	// Filter narrows which reports are counted, exactly as the maps do.
	Filter MapFilter
	// GroupBy splits the result into buckets; empty returns totals only.
	GroupBy AnalyticsGroupBy
	// Limit caps the number of buckets returned.
	Limit int
}

// AnalyticsBucket is one row of an aggregate: a dimension value and its
// figures. Every measure is returned together, so a question about injuries
// costs no more than one about report counts.
type AnalyticsBucket struct {
	// Key is the country, incident type, or the bucket's start date
	// (YYYY-MM-DD) for a time grouping.
	Key        string `json:"key"`
	Reports    int    `json:"reports"`
	Injuries   int    `json:"injuries"`
	Fatalities int    `json:"fatalities"`
}

// AnalyticsResult answers an AnalyticsQuery. Applied echoes the filter the
// figures were computed with, so an answer can state what it counted.
type AnalyticsResult struct {
	Applied    AppliedFilter     `json:"applied"`
	GroupBy    AnalyticsGroupBy  `json:"groupBy,omitempty"`
	Totals     AnalyticsBucket   `json:"totals"`
	Buckets    []AnalyticsBucket `json:"buckets"`
	// Truncated says whether Limit cut buckets off the end.
	Truncated bool `json:"truncated"`
}

// AppliedFilter is the human-readable form of the filter behind a result.
type AppliedFilter struct {
	Country string `json:"country,omitempty"`
	Type    string `json:"type,omitempty"`
	Period  string `json:"period,omitempty"`
	From    string `json:"from,omitempty"`
	To      string `json:"to,omitempty"`
	Query   string `json:"query,omitempty"`
}

// DataOverview describes the reports available to analyse: how many there
// are, the window they cover, and the exact country and type names a query
// can filter by.
type DataOverview struct {
	TotalReports  int               `json:"totalReports"`
	FirstReportAt *time.Time        `json:"firstReportAt,omitempty"`
	LastReportAt  *time.Time        `json:"lastReportAt,omitempty"`
	Countries     []AnalyticsBucket `json:"countries"`
	Types         []AnalyticsBucket `json:"types"`
}
