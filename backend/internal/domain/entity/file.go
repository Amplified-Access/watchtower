package entity

// UploadedFile is the key a stored file is saved under. Records such as
// datasets, reports and applications keep this key, not the file.
type UploadedFile struct {
	FileKey string `json:"fileKey"`
}
