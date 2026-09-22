package entity

import "time"

// MapPeriod is a relative time window for the public maps. It is kept as a
// token rather than resolved to a timestamp before the repository so the
// cache key stays stable ("7d", not the exact second someone asked).
type MapPeriod string

const (
	MapPeriod24h   MapPeriod = "24h"
	MapPeriod7d    MapPeriod = "7d"
	MapPeriod30d   MapPeriod = "30d"
	MapPeriodWeek  MapPeriod = "week"
	MapPeriodMonth MapPeriod = "month"
	MapPeriodYear  MapPeriod = "year"
)

// Interval is the Postgres interval for the period, or "" when it's unknown.
func (p MapPeriod) Interval() string {
	switch p {
	case MapPeriod24h:
		return "24 hours"
	case MapPeriod7d, MapPeriodWeek:
		return "7 days"
	case MapPeriod30d:
		return "30 days"
	case MapPeriodMonth:
		return "1 month"
	case MapPeriodYear:
		return "1 year"
	}
	return ""
}

// MapFilter narrows the public map endpoints. Zero values mean "no filter".
type MapFilter struct {
	// Category is an incident type name, as the thematic maps use it.
	Category string
	// ExcludeTypeIDs are incident types switched off in the live map's panel.
	ExcludeTypeIDs []string
	Country        string
	Period         MapPeriod
	// From and To bound a custom date range; To is exclusive.
	From  *time.Time
	To    *time.Time
	Query string
}

// MapReportRow is the slice of an anonymous report the maps need.
type MapReportRow struct {
	ID             string    `json:"id"`
	IncidentTypeID string    `json:"incidentTypeId"`
	Location       Location  `json:"location"`
	CreatedAt      time.Time `json:"createdAt"`
}

// MapFeatureCollection is GeoJSON the frontend hands straight to a Mapbox
// source. BBox ([minLon, minLat, maxLon, maxLat]) lets the map fit the data
// without walking the features itself.
type MapFeatureCollection struct {
	Type     string       `json:"type"`
	BBox     []float64    `json:"bbox,omitempty"`
	Features []MapFeature `json:"features"`
}

type MapFeature struct {
	Type       string               `json:"type"`
	Geometry   MapPointGeometry     `json:"geometry"`
	Properties MapFeatureProperties `json:"properties"`
}

type MapPointGeometry struct {
	Type        string     `json:"type"`
	Coordinates [2]float64 `json:"coordinates"`
}

// MapFeatureProperties stay small on purpose: the description and casualty
// figures are fetched per report when a marker is clicked.
type MapFeatureProperties struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Country   string    `json:"country,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type MapCountryCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type MapTypeCount struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Count int    `json:"count"`
}

// MapSummary is what the map chrome shows around the points: headline
// numbers, the country list and the most-reported countries and types.
type MapSummary struct {
	TotalReports  int               `json:"totalReports"`
	RecentReports int               `json:"recentReports"`
	Countries     []MapCountryCount `json:"countries"`
	Types         []MapTypeCount    `json:"types"`
}

// MapReportDetail is the public view of one report, for a marker's popup.
// Evidence and audio file keys are deliberately left out.
type MapReportDetail struct {
	ID             string    `json:"id"`
	IncidentTypeID string    `json:"incidentTypeId"`
	Name           string    `json:"name"`
	Country        string    `json:"country,omitempty"`
	Description    string    `json:"description"`
	Injuries       int       `json:"injuries"`
	Fatalities     int       `json:"fatalities"`
	CreatedAt      time.Time `json:"createdAt"`
}

// DisplayName is how a report's place is labelled on the maps.
func (l Location) DisplayName() string {
	for _, v := range []*string{l.Name, l.Address, l.Country} {
		if v != nil && *v != "" {
			return *v
		}
	}
	return "Unknown Location"
}
