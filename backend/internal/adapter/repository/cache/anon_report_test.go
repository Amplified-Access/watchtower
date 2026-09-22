package cache

import (
	"testing"
	"time"

	"backend/internal/domain/entity"
)

func TestMapRowsKey(t *testing.T) {
	day := time.Date(2026, 9, 10, 15, 4, 0, 0, time.UTC)
	base := entity.MapFilter{Category: "Police misconduct", ExcludeTypeIDs: []string{"b", "a"}, Period: entity.MapPeriod7d, Query: "Water"}

	same := base
	same.ExcludeTypeIDs = []string{"a", "b"}
	same.Query = "water"
	if mapRowsKey("1", base) != mapRowsKey("1", same) {
		t.Error("excluded-type order and query case shouldn't change the key")
	}
	if mapRowsKey("1", base) == mapRowsKey("2", base) {
		t.Error("a new version should give a new key, so Create strands old entries")
	}
	if mapRowsKey("", base) != mapRowsKey("0", base) {
		t.Error("a missing version counter should read as version 0")
	}

	withDay := entity.MapFilter{From: &day}
	sameDay := day.Add(3 * time.Hour)
	if mapRowsKey("1", withDay) != mapRowsKey("1", entity.MapFilter{From: &sameDay}) {
		t.Error("dates are whole days, so times within the day share a key")
	}
	other := base
	other.Country = "Kenya"
	if mapRowsKey("1", base) == mapRowsKey("1", other) {
		t.Error("different filters must not share a key")
	}
}
