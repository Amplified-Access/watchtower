package entity

// countryCenters places reports submitted without coordinates (0,0) at their
// country's centre, so they still appear on the maps. Moved here from the
// frontend's tRPC router so every client gets the same placement.
var countryCenters = map[string][2]float64{ // [lon, lat]
	"Kenya":                        {37.9062, -0.0236},
	"Uganda":                       {32.2903, 1.3733},
	"Tanzania":                     {34.8888, -6.3690},
	"Rwanda":                       {29.8739, -1.9403},
	"Ethiopia":                     {40.4897, 9.1450},
	"Nigeria":                      {8.6753, 9.0820},
	"Ghana":                        {-1.0232, 7.9465},
	"South Africa":                 {22.9375, -30.5595},
	"Egypt":                        {30.8025, 26.8206},
	"Sudan":                        {30.2176, 12.8628},
	"Somalia":                      {46.1996, 5.1521},
	"DRC":                          {21.7587, -4.0383},
	"Democratic Republic of Congo": {21.7587, -4.0383},
	"Cameroon":                     {11.5021, 3.8480},
	"Senegal":                      {-14.4524, 14.4974},
	"Pakistan":                     {69.3451, 30.3753},
	"India":                        {78.9629, 20.5937},
	"Bangladesh":                   {90.3563, 23.6850},
	"Afghanistan":                  {67.7100, 33.9391},
	"Myanmar":                      {95.9560, 21.9162},
}

// MapCoordinates returns where a report belongs on a map as [lon, lat]. A
// report stored at 0,0 falls back to its country's centre; ok is false when
// there is nowhere to put it.
func (l Location) MapCoordinates() (coords [2]float64, ok bool) {
	if l.Latitude != 0 || l.Longitude != 0 {
		return [2]float64{l.Longitude, l.Latitude}, true
	}
	if l.Country != nil {
		if c, found := countryCenters[*l.Country]; found {
			return c, true
		}
	}
	return coords, false
}
