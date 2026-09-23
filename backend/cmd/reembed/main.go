// Command reembed rewrites every stored knowledge-base vector with the
// current embedding model (pkg/gemini.EmbeddingModel).
//
// Vectors from different models aren't comparable, so when the model
// changes, searching stops matching until every row is re-embedded. Only
// the `embedding` column is rewritten — the chunk text in `content` and the
// rows in `resources` are left exactly as they are.
//
// Usage (from backend/):
//
//	go run ./cmd/reembed              # dry run: embeds, writes nothing
//	go run ./cmd/reembed -apply       # rewrites every row, after a backup
//	go run ./cmd/reembed -limit 2     # dry run over the first 2 rows
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"

	"backend/pkg/gemini"
)

// pause between embed calls, to stay inside the free tier's per-minute limit.
const pause = 500 * time.Millisecond

type row struct {
	ID       string    `json:"id"`
	Content  string    `json:"content"`
	Vector   []float32 `json:"embedding"`
	replaced []float32
}

func main() {
	apply := flag.Bool("apply", false, "write the new vectors (otherwise it's a dry run)")
	limit := flag.Int("limit", 0, "only process this many rows (0 = all)")
	backupPath := flag.String("backup", "", "where to write the backup (default: reembed-backup-<timestamp>.json)")
	flag.Parse()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	rows, err := load(ctx, db, *limit)
	if err != nil {
		log.Fatalf("read embeddings: %v", err)
	}
	log.Printf("read %d rows; embedding with %s at %d dimensions", len(rows), gemini.EmbeddingModel, gemini.EmbeddingDimensions)

	client := gemini.New()
	for i, r := range rows {
		vector, err := client.Embed(ctx, r.Content)
		if err != nil {
			log.Fatalf("embed row %s: %v", r.ID, err)
		}
		rows[i].replaced = vector
		if (i+1)%10 == 0 || i+1 == len(rows) {
			log.Printf("embedded %d/%d", i+1, len(rows))
		}
		time.Sleep(pause)
	}

	if !*apply {
		log.Printf("dry run: nothing written. Re-run with -apply to rewrite %d rows.", len(rows))
		return
	}

	path := *backupPath
	if path == "" {
		path = fmt.Sprintf("reembed-backup-%s.json", time.Now().Format("20060102-150405"))
	}
	if err := backup(path, rows); err != nil {
		log.Fatalf("backup: %v", err)
	}
	log.Printf("backed up the old vectors and their text to %s", path)

	if err := write(ctx, db, rows); err != nil {
		log.Fatalf("write vectors: %v", err)
	}
	log.Printf("rewrote %d vectors", len(rows))
}

func load(ctx context.Context, db *sql.DB, limit int) ([]row, error) {
	q := "SELECT id, content, embedding::text FROM embeddings ORDER BY id"
	if limit > 0 {
		q += " LIMIT " + strconv.Itoa(limit)
	}
	res, err := db.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer res.Close()

	var rows []row
	for res.Next() {
		var r row
		var vector string
		if err := res.Scan(&r.ID, &r.Content, &vector); err != nil {
			return nil, err
		}
		if r.Vector, err = parseVector(vector); err != nil {
			return nil, fmt.Errorf("row %s: %w", r.ID, err)
		}
		rows = append(rows, r)
	}
	return rows, res.Err()
}

// write replaces every vector in one transaction, so a failure part-way
// through doesn't leave the table split between two models.
func write(ctx context.Context, db *sql.DB, rows []row) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	for _, r := range rows {
		if _, err := tx.ExecContext(ctx,
			"UPDATE embeddings SET embedding = $1::vector WHERE id = $2",
			vectorLiteral(r.replaced), r.ID); err != nil {
			return fmt.Errorf("row %s: %w", r.ID, err)
		}
	}
	return tx.Commit()
}

func backup(path string, rows []row) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(rows)
}

func vectorLiteral(v []float32) string {
	parts := make([]string, len(v))
	for i, f := range v {
		parts[i] = strconv.FormatFloat(float64(f), 'g', -1, 32)
	}
	return "[" + strings.Join(parts, ",") + "]"
}

func parseVector(s string) ([]float32, error) {
	fields := strings.Split(strings.Trim(s, "[]"), ",")
	v := make([]float32, len(fields))
	for i, f := range fields {
		parsed, err := strconv.ParseFloat(strings.TrimSpace(f), 32)
		if err != nil {
			return nil, fmt.Errorf("parse vector: %w", err)
		}
		v[i] = float32(parsed)
	}
	return v, nil
}
