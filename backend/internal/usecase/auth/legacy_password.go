package authusecase

import (
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"

	"golang.org/x/crypto/scrypt"
	"golang.org/x/text/unicode/norm"
)

// Better Auth (which managed accounts before the Go backend) stored password
// hashes as "<saltHex>:<keyHex>", using scrypt with these parameters. The
// values come from @better-auth/utils 0.4.0's password module and must match
// it exactly, or existing users can't sign in.
const (
	betterAuthScryptN      = 16384
	betterAuthScryptR      = 16
	betterAuthScryptP      = 1
	betterAuthScryptKeyLen = 64
)

// isBetterAuthHash reports whether hash is in Better Auth's scrypt format
// rather than the argon2id PHC strings this backend writes.
func isBetterAuthHash(hash string) bool {
	return !strings.HasPrefix(hash, "$") && strings.Count(hash, ":") == 1
}

// verifyBetterAuthPassword checks a password against a Better Auth scrypt hash.
// Two details matter for compatibility: the password is NFKC-normalised first,
// and the salt passed to scrypt is the hex string itself (its ASCII bytes),
// not the 16 bytes it encodes.
func verifyBetterAuthPassword(hash, password string) error {
	salt, keyHex, ok := strings.Cut(hash, ":")
	if !ok || salt == "" || keyHex == "" {
		return fmt.Errorf("malformed scrypt hash")
	}
	storedKey, err := hex.DecodeString(keyHex)
	if err != nil || len(storedKey) != betterAuthScryptKeyLen {
		return fmt.Errorf("malformed scrypt key")
	}

	derived, err := scrypt.Key(
		[]byte(norm.NFKC.String(password)),
		[]byte(salt),
		betterAuthScryptN, betterAuthScryptR, betterAuthScryptP, betterAuthScryptKeyLen,
	)
	if err != nil {
		return fmt.Errorf("derive key: %w", err)
	}
	if subtle.ConstantTimeCompare(derived, storedKey) != 1 {
		return fmt.Errorf("password mismatch")
	}
	return nil
}
