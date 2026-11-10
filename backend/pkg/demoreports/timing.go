package demoreports

import (
	"math"
	"math/rand"
	"time"
)

// RampedTime picks a moment between from and to, with reports growing more
// frequent over the period: the last day is twice as busy as the first, the
// way a platform picks up users.
func RampedTime(rng *rand.Rand, from, to time.Time) time.Time {
	// Density rises linearly from 0.5 to 1. Inverting its CDF,
	// (0.5x + 0.25x²) / 0.75 = u, gives the fraction of the period.
	u := rng.Float64()
	x := (-0.5 + math.Sqrt(0.25+0.75*u)) / 0.5
	return from.Add(time.Duration(x * float64(to.Sub(from))))
}
