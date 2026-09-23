package gemini

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// vectorJSON is a response body of n dimensions, as the API returns.
func vectorJSON(n int) string {
	values := make([]string, n)
	for i := range values {
		values[i] = fmt.Sprintf("%.3f", float64(i%10)/10)
	}
	return `{"embedding":{"values":[` + strings.Join(values, ",") + `]}}`
}

func TestEmbed_SendsKeyInHeaderAndParsesValues(t *testing.T) {
	var gotKey, gotModel, gotText string
	var gotDimensions int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotKey = r.Header.Get("x-goog-api-key")
		if r.URL.Query().Get("key") != "" {
			t.Error("the API key must not be in the URL")
		}
		var body embedRequest
		_ = json.NewDecoder(r.Body).Decode(&body)
		gotModel, gotText = body.Model, body.Content.Parts[0].Text
		gotDimensions = body.OutputDimensionality
		_, _ = w.Write([]byte(vectorJSON(EmbeddingDimensions)))
	}))
	defer srv.Close()

	c := &Client{apiKey: "k", http: srv.Client(), url: srv.URL}
	v, err := c.Embed(context.Background(), "hello")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotKey != "k" || gotModel != "models/"+EmbeddingModel || gotText != "hello" {
		t.Errorf("request: key=%q model=%q text=%q", gotKey, gotModel, gotText)
	}
	if gotDimensions != EmbeddingDimensions {
		t.Errorf("request asked for %d dimensions, want %d", gotDimensions, EmbeddingDimensions)
	}
	if len(v) != EmbeddingDimensions || v[1] != 0.1 {
		t.Errorf("values: len=%d, v[1]=%v", len(v), v[1])
	}
}

// The stored vectors are vector(768); a response of any other width would be
// written into the column or compared against it wrongly.
func TestEmbed_RejectsWrongDimensions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(vectorJSON(EmbeddingDimensions / 2)))
	}))
	defer srv.Close()
	c := &Client{apiKey: "k", http: srv.Client(), url: srv.URL}
	if _, err := c.Embed(context.Background(), "x"); err == nil || !strings.Contains(err.Error(), "dimensions") {
		t.Errorf("want a dimensions error, got %v", err)
	}
}

func TestEmbed_Errors(t *testing.T) {
	if _, err := (&Client{}).Embed(context.Background(), "x"); !errors.Is(err, ErrNotConfigured) {
		t.Errorf("missing key: want ErrNotConfigured, got %v", err)
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"error":{"message":"API key not valid"}}`))
	}))
	defer srv.Close()
	c := &Client{apiKey: "bad", http: srv.Client(), url: srv.URL}
	if _, err := c.Embed(context.Background(), "x"); err == nil || err.Error() != "gemini: embed failed: API key not valid" {
		t.Errorf("want the API's error message, got %v", err)
	}
}
