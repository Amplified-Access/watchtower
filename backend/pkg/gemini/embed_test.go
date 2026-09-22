package gemini

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEmbed_SendsKeyInHeaderAndParsesValues(t *testing.T) {
	var gotKey, gotModel, gotText string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotKey = r.Header.Get("x-goog-api-key")
		if r.URL.Query().Get("key") != "" {
			t.Error("the API key must not be in the URL")
		}
		var body embedRequest
		_ = json.NewDecoder(r.Body).Decode(&body)
		gotModel, gotText = body.Model, body.Content.Parts[0].Text
		_, _ = w.Write([]byte(`{"embedding":{"values":[0.25,-0.5]}}`))
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
	if len(v) != 2 || v[0] != 0.25 || v[1] != -0.5 {
		t.Errorf("values = %v", v)
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
