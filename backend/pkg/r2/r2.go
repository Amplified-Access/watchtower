// Package r2 stores and fetches files in Cloudflare R2 through its
// S3-compatible API.
package r2

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// defaultBucket is the bucket every existing file key lives in.
const defaultBucket = "amplified-access-bucket"

// ErrNotConfigured means the R2 endpoint or credentials aren't set.
var ErrNotConfigured = errors.New("r2: CLOUDFLARE_S3_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID and CLOUDFLARE_SECRET_KEY must be set")

type Client struct {
	s3     *s3.Client
	bucket string
}

// New reads the R2 settings from the environment. Missing settings don't
// fail here, only when a file is stored or fetched, so the server still
// starts without them.
func New() *Client {
	c := &Client{bucket: os.Getenv("CLOUDFLARE_R2_BUCKET")}
	if c.bucket == "" {
		c.bucket = defaultBucket
	}

	endpoint := os.Getenv("CLOUDFLARE_S3_ENDPOINT")
	keyID := os.Getenv("CLOUDFLARE_ACCESS_KEY_ID")
	secret := os.Getenv("CLOUDFLARE_SECRET_KEY")
	if endpoint == "" || keyID == "" || secret == "" {
		return c
	}

	c.s3 = s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(keyID, secret, ""),
		// R2 doesn't accept every checksum the SDK sends by default.
		RequestChecksumCalculation: aws.RequestChecksumCalculationWhenRequired,
		ResponseChecksumValidation: aws.ResponseChecksumValidationWhenRequired,
	})
	return c
}

// Put stores body under key. body must be seekable (a multipart file is) so
// the request can be signed without buffering it.
func (c *Client) Put(ctx context.Context, key, contentType string, body io.Reader, size int64) error {
	if c.s3 == nil {
		return ErrNotConfigured
	}
	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(c.bucket),
		Key:           aws.String(key),
		Body:          body,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("r2: put %q: %w", key, err)
	}
	return nil
}

// Get opens the file stored under key. The caller closes body. size is -1
// when R2 doesn't report it. A missing key returns an error wrapping
// fs.ErrNotExist.
func (c *Client) Get(ctx context.Context, key string) (body io.ReadCloser, contentType string, size int64, err error) {
	if c.s3 == nil {
		return nil, "", 0, ErrNotConfigured
	}
	out, err := c.s3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		var noKey *types.NoSuchKey
		if errors.As(err, &noKey) {
			return nil, "", 0, fmt.Errorf("r2: get %q: %w", key, fs.ErrNotExist)
		}
		return nil, "", 0, fmt.Errorf("r2: get %q: %w", key, err)
	}
	size = -1 // unknown
	if out.ContentLength != nil {
		size = *out.ContentLength
	}
	return out.Body, aws.ToString(out.ContentType), size, nil
}
