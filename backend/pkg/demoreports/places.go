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
// relative to the others: bigger towns report more.
type Place struct {
	Name      string
	Country   string
	Latitude  float64
	Longitude float64
	Weight    int
}

// Places are the towns the demonstration reports come from, in the six
// countries the live map already covers.
var Places = []Place{
	// Kenya
	{"Nairobi", "Kenya", -1.286389, 36.817223, 30},
	{"Mombasa", "Kenya", -4.043477, 39.668206, 12},
	{"Kisumu", "Kenya", -0.091702, 34.767956, 9},
	{"Nakuru", "Kenya", -0.303099, 36.080026, 8},
	{"Eldoret", "Kenya", 0.514277, 35.269779, 7},
	{"Machakos", "Kenya", -1.517684, 37.263414, 4},
	{"Nyeri", "Kenya", -0.420131, 36.947594, 4},
	{"Garissa", "Kenya", -0.453229, 39.646099, 3},
	// Uganda
	{"Kampala", "Uganda", 0.347596, 32.582520, 26},
	{"Gulu", "Uganda", 2.774570, 32.298990, 7},
	{"Mbarara", "Uganda", -0.607160, 30.654540, 6},
	{"Jinja", "Uganda", 0.424440, 33.204170, 6},
	{"Fort Portal", "Uganda", 0.671532, 30.285832, 4},
	{"Mbale", "Uganda", 1.082100, 34.175000, 5},
	{"Lira", "Uganda", 2.249900, 32.899900, 4},
	{"Arua", "Uganda", 3.020130, 30.910730, 3},
	// Tanzania
	{"Dar es Salaam", "Tanzania", -6.792354, 39.208328, 22},
	{"Arusha", "Tanzania", -3.386925, 36.682995, 8},
	{"Mwanza", "Tanzania", -2.516430, 32.917480, 8},
	{"Dodoma", "Tanzania", -6.162959, 35.751607, 7},
	{"Mbeya", "Tanzania", -8.909401, 33.460773, 4},
	{"Zanzibar City", "Tanzania", -6.165917, 39.202641, 5},
	{"Tanga", "Tanzania", -5.068930, 39.098750, 3},
	// Ethiopia
	{"Addis Ababa", "Ethiopia", 9.005401, 38.763611, 22},
	{"Bahir Dar", "Ethiopia", 11.593430, 37.391304, 6},
	{"Hawassa", "Ethiopia", 7.062030, 38.476350, 6},
	{"Mekelle", "Ethiopia", 13.496670, 39.475280, 5},
	{"Dire Dawa", "Ethiopia", 9.600870, 41.850140, 5},
	{"Gondar", "Ethiopia", 12.600000, 37.466670, 4},
	{"Adama", "Ethiopia", 8.540000, 39.270000, 4},
	// Rwanda
	{"Kigali", "Rwanda", -1.944369, 30.061052, 14},
	{"Huye", "Rwanda", -2.596670, 29.739440, 3},
	{"Musanze", "Rwanda", -1.499840, 29.634970, 3},
	{"Rubavu", "Rwanda", -1.678070, 29.258930, 3},
	// Pakistan
	{"Karachi", "Pakistan", 24.860966, 67.010040, 20},
	{"Lahore", "Pakistan", 31.520370, 74.358749, 18},
	{"Islamabad", "Pakistan", 33.720052, 73.057766, 10},
	{"Rawalpindi", "Pakistan", 33.565109, 73.016914, 7},
	{"Faisalabad", "Pakistan", 31.418715, 73.079109, 7},
	{"Peshawar", "Pakistan", 34.015137, 71.524915, 7},
	{"Multan", "Pakistan", 30.157458, 71.524918, 5},
	{"Quetta", "Pakistan", 30.183270, 66.996452, 4},
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

// jitterKm is how far from a town's centre a report can land. Reports pinned
// to the exact same point would stack into one marker; real ones spread over
// the town and its outskirts.
const jitterKm = 6.0

// Scatter moves a point a random distance (denser near the centre) of up to
// jitterKm in a random direction.
func Scatter(rng *rand.Rand, lat, lon float64) (float64, float64) {
	distance := jitterKm * math.Sqrt(rng.Float64()) * rng.Float64()
	bearing := rng.Float64() * 2 * math.Pi
	const kmPerDegree = 111.32
	dLat := distance * math.Cos(bearing) / kmPerDegree
	dLon := distance * math.Sin(bearing) / (kmPerDegree * math.Cos(lat*math.Pi/180))
	return lat + dLat, lon + dLon
}
