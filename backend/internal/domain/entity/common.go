package entity

type ListParams struct {
	Limit          int
	Offset        int
	Search        string
	Sort          string
	SortOrder     string
	Status       string
	Organization string
}

type PaginatedResult[T any] struct {
	Data   []T `json:"data"`
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}
