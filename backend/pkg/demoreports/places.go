// Package demoreports generates believable anonymous incident reports for
// the demonstration data on the public maps: a place, a description written
// for the report's incident type, and casualty figures that fit it.
//
// Both the one-off top-up (cmd/topup) and the weekly refresh cron
// (cmd/refresh) use it, so the reports they add read alike.
package demoreports

import (
	"math"
	"math/rand"
)

// Place is a town reports can come from. Weight is its share of reports
// relative to the others: bigger towns report more. RadiusKm is how far from
// the point reports can land (defaultRadiusKm when zero).
//
// Towns on a lake, the sea or a border have their point moved inland and a
// small radius, so no report lands in the water or across the border:
// a pin labelled Rubavu, Rwanda must not land in Goma.
type Place struct {
	Name      string
	Country   string
	Latitude  float64
	Longitude float64
	Weight    int
	RadiusKm  float64
}

// Places are the towns the demonstration reports come from, in the six
// countries the live map already covers.
var Places = []Place{
	// Kenya
	{"Nairobi", "Kenya", -1.286389, 36.817223, 30, 0},
	{"Mombasa", "Kenya", -4.035, 39.665, 12, 1.5}, // island
	{"Kisumu", "Kenya", -0.090, 34.780, 9, 2.5},   // Lake Victoria to the west
	{"Nakuru", "Kenya", -0.285, 36.070, 8, 3},     // Lake Nakuru to the south
	{"Eldoret", "Kenya", 0.514277, 35.269779, 7, 0},
	{"Machakos", "Kenya", -1.517684, 37.263414, 4, 0},
	{"Nyeri", "Kenya", -0.420131, 36.947594, 4, 0},
	{"Garissa", "Kenya", -0.453229, 39.646099, 3, 0},
	// Uganda
	{"Kampala", "Uganda", 0.347596, 32.582520, 26, 5}, // Murchison Bay to the south-east
	{"Gulu", "Uganda", 2.774570, 32.298990, 7, 0},
	{"Mbarara", "Uganda", -0.607160, 30.654540, 6, 0},
	{"Jinja", "Uganda", 0.445, 33.205, 6, 2.5}, // Lake Victoria to the south
	{"Fort Portal", "Uganda", 0.671532, 30.285832, 4, 0},
	{"Mbale", "Uganda", 1.082100, 34.175000, 5, 0},
	{"Lira", "Uganda", 2.249900, 32.899900, 4, 0},
	{"Arua", "Uganda", 3.020130, 30.910730, 3, 3}, // DRC border to the west
	// Tanzania
	{"Dar es Salaam", "Tanzania", -6.792354, 39.208328, 22, 0},
	{"Arusha", "Tanzania", -3.386925, 36.682995, 8, 0},
	{"Mwanza", "Tanzania", -2.530, 32.935, 8, 2.5}, // Lake Victoria to the west and north
	{"Dodoma", "Tanzania", -6.162959, 35.751607, 7, 0},
	{"Mbeya", "Tanzania", -8.909401, 33.460773, 4, 0},
	{"Zanzibar City", "Tanzania", -6.170, 39.225, 5, 2.5}, // sea to the west
	{"Tanga", "Tanzania", -5.085, 39.075, 3, 2},           // sea to the north and east
	// Ethiopia
	{"Addis Ababa", "Ethiopia", 9.005401, 38.763611, 22, 0},
	{"Bahir Dar", "Ethiopia", 11.575, 37.395, 6, 2.5}, // Lake Tana to the north
	{"Hawassa", "Ethiopia", 7.055, 38.490, 6, 2.5},    // Lake Hawassa to the west
	{"Mekelle", "Ethiopia", 13.496670, 39.475280, 5, 0},
	{"Dire Dawa", "Ethiopia", 9.600870, 41.850140, 5, 0},
	{"Gondar", "Ethiopia", 12.600000, 37.466670, 4, 0},
	{"Adama", "Ethiopia", 8.540000, 39.270000, 4, 0},
	// Rwanda
	{"Kigali", "Rwanda", -1.944369, 30.061052, 14, 0},
	{"Huye", "Rwanda", -2.596670, 29.739440, 3, 0},
	{"Musanze", "Rwanda", -1.499840, 29.634970, 3, 0},
	{"Rubavu", "Rwanda", -1.660, 29.290, 3, 1.5}, // DRC border to the west, Lake Kivu to the south
	// Pakistan
	{"Karachi", "Pakistan", 24.900, 67.080, 20, 6}, // sea to the south and west
	{"Lahore", "Pakistan", 31.520370, 74.358749, 18, 0},
	{"Islamabad", "Pakistan", 33.720052, 73.057766, 10, 0},
	{"Rawalpindi", "Pakistan", 33.565109, 73.016914, 7, 0},
	{"Faisalabad", "Pakistan", 31.418715, 73.079109, 7, 0},
	{"Peshawar", "Pakistan", 34.015137, 71.524915, 7, 0},
	{"Multan", "Pakistan", 30.157458, 71.524918, 5, 0},
	{"Quetta", "Pakistan", 30.183270, 66.996452, 4, 0},
}

var totalPlaceWeight = func() int {
	total := 0
	for _, p := range Places {
		total += p.Weight
	}
	return total
}()

// RandomPlace picks a town, weighted by how much each one reports.
func RandomPlace(rng *rand.Rand) Place {
	n := rng.Intn(totalPlaceWeight)
	for _, p := range Places {
		if n < p.Weight {
			return p
		}
		n -= p.Weight
	}
	return Places[len(Places)-1]
}

// PlaceNamed finds a town by name, for rewriting a report that already has one.
func PlaceNamed(name string) (Place, bool) {
	for _, p := range Places {
		if p.Name == name {
			return p, true
		}
	}
	return Place{}, false
}

// defaultRadiusKm is how far from a town's point a report can land. Reports
// pinned to the exact same point would stack into one marker; real ones
// spread over the town and its outskirts.
const defaultRadiusKm = 6.0

// Scatter picks a point in the town: a random direction, a random distance
// (denser near the centre) of up to its radius.
func (p Place) Scatter(rng *rand.Rand) (lat, lon float64) {
	radius := p.RadiusKm
	if radius == 0 {
		radius = defaultRadiusKm
	}
	distance := radius * math.Sqrt(rng.Float64()) * rng.Float64()
	bearing := rng.Float64() * 2 * math.Pi
	const kmPerDegree = 111.32
	dLat := distance * math.Cos(bearing) / kmPerDegree
	dLon := distance * math.Sin(bearing) / (kmPerDegree * math.Cos(p.Latitude*math.Pi/180))
	return p.Latitude + dLat, p.Longitude + dLon
}
