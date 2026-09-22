package entity

// KnowledgeMatch is a knowledge-base passage the chat assistant can cite.
type KnowledgeMatch struct {
	Content    string  `json:"content"`
	Similarity float64 `json:"similarity"`
}
