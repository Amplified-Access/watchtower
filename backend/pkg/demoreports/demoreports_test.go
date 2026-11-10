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

func TestNewReport_FillsThePlaceAndDropsMarks(t *testing.T) {
	rng := rand.New(rand.NewSource(1))
	for _, typ := range append(knownTypes, "Something new") {
		for range 500 {
			r := NewReport(rng, typ, "Gulu")
			if strings.Contains(r.Description, "{place}") || strings.Contains(r.Description, hurtMark) {
				t.Fatalf("%s: unfilled description %q", typ, r.Description)
			}
			if r.Injuries < 0 || r.Fatalities < 0 {
				t.Fatalf("%s: negative casualties %+v", typ, r)
			}
		}
	}
}

func TestNewReport_OnlyHurtfulSentencesCarryCasualties(t *testing.T) {
	rng := rand.New(rand.NewSource(2))
	sawInjuries := false
	for range 5000 {
		r := NewReport(rng, "Public demonstrations", "Kampala")
		if strings.Contains(r.Description, "remained peaceful") && r.Injuries > 0 {
			t.Fatalf("peaceful protest with injuries: %+v", r)
		}
		sawInjuries = sawInjuries || r.Injuries > 0
	}
	if !sawInjuries {
		t.Fatal("no demonstration ever had injuries")
	}
	for range 2000 {
		if r := NewReport(rng, "Community petitions", "Kampala"); r.Injuries > 0 || r.Fatalities > 0 {
			t.Fatalf("petition with casualties: %+v", r)
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

func TestScatter_StaysNearTown(t *testing.T) {
	rng := rand.New(rand.NewSource(4))
	for _, p := range Places {
		for range 200 {
			lat, lon := Scatter(rng, p.Latitude, p.Longitude)
			if math.Abs(lat-p.Latitude) > 0.06 || math.Abs(lon-p.Longitude) > 0.07 {
				t.Fatalf("%s scattered too far: %v,%v", p.Name, lat, lon)
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
