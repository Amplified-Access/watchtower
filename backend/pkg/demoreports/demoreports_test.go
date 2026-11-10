package demoreports

import (
	"math"
	"math/rand"
	"strings"
	"testing"
	"time"
)

var knownTypes = []string{
	"Election Irregularities",
	"Abuse of office",
	"Public demonstrations",
	"Community petitions",
	"Police misconduct",
	"Misuse of public funds",
}

func TestNewReport_FillsThePlaceAndDropsTags(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	for _, typ := range append(knownTypes, "Something new") {
		for range 500 {
			r := NewReport(rng, typ, "Gulu")
			if strings.ContainsAny(r.Description, "{}[]") {
				t.Fatalf("%s: unfilled description %q", typ, r.Description)
			}
			if r.Injuries < 0 || r.Fatalities < 0 {
				t.Fatalf("%s: negative casualties %+v", typ, r)
			}
		}
	}
}

// Sentences that need something can only follow one that provides it; this
// samples heavily and checks pairs that would read as contradictions.
func TestNewReport_SentencesFitTogether(t *testing.T) {
	rng := rand.New(rand.NewSource(2))
	sawInjuries, sawDeath := false, false
	for range 20000 {
		r := NewReport(rng, "Public demonstrations", "Kampala")
		d := r.Description
		if strings.Contains(d, "remained peaceful") && (r.Injuries > 0 || strings.Contains(d, "use of force") || strings.Contains(d, "Calm returned")) {
			t.Fatalf("peaceful protest reads as violent: %+v", r)
		}
		if strings.Contains(d, "Those arrested") && !strings.Contains(d, "were arrested") {
			t.Fatalf("arrests out of nowhere: %q", d)
		}
		sawInjuries = sawInjuries || r.Injuries > 0
		sawDeath = sawDeath || r.Fatalities > 0
	}
	if !sawInjuries || !sawDeath {
		t.Fatal("demonstrations never had injuries or deaths")
	}
	for range 20000 {
		r := NewReport(rng, "Police misconduct", "Kampala")
		if strings.Contains(r.Description, "later treated") && (r.Injuries == 0 || r.Fatalities > 0) {
			t.Fatalf("treated but nobody hurt, or treated and died: %+v", r)
		}
		if strings.Contains(r.Description, "seek the person's release") && !strings.Contains(r.Description, "held") && !strings.Contains(r.Description, "bundled") {
			t.Fatalf("release of someone not held: %q", r.Description)
		}
	}
	for range 5000 {
		if r := NewReport(rng, "Community petitions", "Kampala"); r.Injuries > 0 || r.Fatalities > 0 {
			t.Fatalf("petition with casualties: %+v", r)
		}
	}
}

// Every sentence's requirements can be met by some event, and every event
// has at least one detail and follow-up that fits it.
func TestEveryTagCanBeSatisfied(t *testing.T) {
	for name, tmpl := range append([]templates{generic}, func() []templates {
		var all []templates
		for _, v := range byType {
			all = append(all, v)
		}
		return all
	}()...) {
		for _, ev := range tmpl.events {
			have := parse(ev).provides
			detailFits := 0
			for _, d := range tmpl.details {
				if parse(d).fits(have) {
					detailFits++
				}
			}
			if detailFits == 0 {
				t.Errorf("%d: no detail fits %q", name, ev)
			}
		}
		for _, list := range [][]string{tmpl.details, tmpl.followUps} {
			for _, raw := range list {
				for _, need := range parse(raw).needs {
					found := false
					for _, src := range append(append([]string{}, tmpl.events...), tmpl.details...) {
						found = found || parse(src).provides[need]
					}
					if !found {
						t.Errorf("nothing provides [%s] needed by %q", need, raw)
					}
				}
			}
		}
	}
}

func TestEveryTypeHasEnoughVariety(t *testing.T) {
	for name, tmpl := range byType {
		if len(tmpl.events)*len(tmpl.details)*len(tmpl.followUps) < 400 {
			t.Errorf("%s has too few combinations", name)
		}
	}
	for _, typ := range knownTypes {
		if _, ok := byType[typ]; !ok {
			t.Errorf("no sentences for %q", typ)
		}
	}
}

func TestRandomPlace_FollowsWeights(t *testing.T) {
	rng := rand.New(rand.NewSource(3))
	counts := map[string]int{}
	const draws = 200_000
	for range draws {
		counts[RandomPlace(rng).Name]++
	}
	for _, p := range Places {
		want := float64(p.Weight) / float64(totalPlaceWeight) * draws
		if got := float64(counts[p.Name]); math.Abs(got-want) > want*0.15+50 {
			t.Errorf("%s: got %v draws, want about %v", p.Name, got, want)
		}
	}
}

func TestScatter_StaysWithinTheTownsRadius(t *testing.T) {
	rng := rand.New(rand.NewSource(4))
	for _, p := range Places {
		radius := p.RadiusKm
		if radius == 0 {
			radius = defaultRadiusKm
		}
		for range 500 {
			lat, lon := p.Scatter(rng)
			dy := (lat - p.Latitude) * 111.32
			dx := (lon - p.Longitude) * 111.32 * math.Cos(p.Latitude*math.Pi/180)
			if d := math.Hypot(dx, dy); d > radius+0.01 {
				t.Fatalf("%s: %.2f km from its point, radius %.1f", p.Name, d, radius)
			}
		}
	}
}

func TestRampedTime_StaysInRangeAndRises(t *testing.T) {
	rng := rand.New(rand.NewSource(5))
	from := time.Date(2025, 5, 1, 0, 0, 0, 0, time.UTC)
	to := from.AddDate(1, 0, 0)
	mid := from.Add(to.Sub(from) / 2)
	firstHalf, secondHalf := 0, 0
	for range 100_000 {
		ts := RampedTime(rng, from, to)
		if ts.Before(from) || ts.After(to) {
			t.Fatalf("%v outside range", ts)
		}
		if ts.Before(mid) {
			firstHalf++
		} else {
			secondHalf++
		}
	}
	// With density 0.5→1 the second half holds 7/12 of the reports.
	if ratio := float64(secondHalf) / 100_000; math.Abs(ratio-7.0/12) > 0.01 {
		t.Errorf("second half holds %.3f of reports, want about %.3f", ratio, 7.0/12)
	}
}

func TestIsPlaceholder(t *testing.T) {
	if !IsPlaceholder("Weekly refresh report #5 — Addis Ababa") {
		t.Error("placeholder not recognised")
	}
	if IsPlaceholder("Residents of Gulu reported a weekly refresh of water supply.") {
		t.Error("real report taken for a placeholder")
	}
}

func TestPlaceNamed(t *testing.T) {
	if p, ok := PlaceNamed("Addis Ababa"); !ok || p.Country != "Ethiopia" {
		t.Errorf("PlaceNamed(Addis Ababa) = %+v, %v", p, ok)
	}
	if _, ok := PlaceNamed("Atlantis"); ok {
		t.Error("found a town that isn't listed")
	}
}

func TestCatchUpCount_KeepsThePace(t *testing.T) {
	rng := rand.New(rand.NewSource(6))
	window := 28 * 24 * time.Hour
	// 6,000 reports in four weeks is about 214 a day.
	if n := CatchUpCount(rng, 6000, window, 24*time.Hour); n < 210 || n > 220 {
		t.Errorf("one day's catch-up = %d, want about 214", n)
	}
	if n := CatchUpCount(rng, 6000, window, 7*24*time.Hour); n < 1490 || n > 1520 {
		t.Errorf("one week's catch-up = %d, want about 1,500", n)
	}
	// A run straight after another adds next to nothing.
	total := 0
	for range 1000 {
		total += CatchUpCount(rng, 6000, window, 10*time.Second)
	}
	if total > 60 {
		t.Errorf("1,000 back-to-back runs added %d reports", total)
	}
	for _, gap := range []time.Duration{0, -time.Hour} {
		if n := CatchUpCount(rng, 6000, window, gap); n != 0 {
			t.Errorf("gap %v added %d", gap, n)
		}
	}
	if n := CatchUpCount(rng, 6000, window, 10*365*24*time.Hour); n != maxCatchUp {
		t.Errorf("a huge gap should be capped, got %d", n)
	}
}
