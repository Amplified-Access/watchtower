// Package gemini wraps the Google Generative AI embeddings endpoint.
package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"
)

// EmbeddingModel must stay the model the stored knowledge-base vectors were
// made with (768 dimensions), or query vectors won't be comparable with them.
const EmbeddingModel = "text-embedding-004"

const embedURL = "https://generativelanguage.googleapis.com/v1beta/models/" + EmbeddingModel + ":embedContent"

// ErrNotConfigured means GOOGLE_GENERATIVE_AI_API_KEY isn't set.
var ErrNotConfigured = errors.New("gemini: GOOGLE_GENERATIVE_AI_API_KEY is not set")

type Client struct {
	apiKey string
	http   *http.Client
	url    string
}

// New reads the API key from the environment. A missing key doesn't fail
// here, only when Embed is called, so the server still starts without it.
func New() *Client {
	return &Client{
		apiKey: os.Getenv("GOOGLE_GENERATIVE_AI_API_KEY"),
		http:   &http.Client{Timeout: 10 * time.Second},
		url:    embedURL,
	}
}

type embedRequest struct {
	Model   string `json:"model"`
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
}

type embedResponse struct {
	Embedding struct {
		Values []float32 `json:"values"`
	} `json:"embedding"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

// Embed returns the embedding vector for text.
func (c *Client) Embed(ctx context.Context, text string) ([]float32, error) {
	if c.apiKey == "" {
		return nil, ErrNotConfigured
	}

	var reqBody embedRequest
	reqBody.Model = "models/" + EmbeddingModel
	reqBody.Content.Parts = []struct {
		Text string `json:"text"`
	}{{Text: text}}
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	// Header rather than ?key=, so the key never lands in request logs.
	req.Header.Set("x-goog-api-key", c.apiKey)

	res, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gemini: embed request: %w", err)
	}
	defer res.Body.Close()

	var body embedResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("gemini: decode response (status %d): %w", res.StatusCode, err)
	}
	if res.StatusCode != http.StatusOK {
		msg := res.Status
		if body.Error != nil && body.Error.Message != "" {
			msg = body.Error.Message
		}
		return nil, fmt.Errorf("gemini: embed failed: %s", msg)
	}
	if len(body.Embedding.Values) == 0 {
		return nil, errors.New("gemini: empty embedding")
	}
	return body.Embedding.Values, nil
}
