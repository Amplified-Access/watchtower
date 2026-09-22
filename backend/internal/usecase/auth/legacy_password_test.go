package authusecase

import (
	"context"
	"errors"
	"strings"
	"testing"

	"backend/internal/domain/entity"
	domainerrors "backend/internal/domain/errors"
)

// Hashes produced by Better Auth itself (@better-auth/utils 0.4.0,
// hashPassword from password.node.mjs), so these pin the exact format.
var betterAuthFixtures = []struct{ password, hash string }{
	{"Watchtower-2026!", "1ca92677a6041515cf57fdb4dae4a361:5e3d24fdee2188c7b51152cacf27372099e47c56554b7827110669e26ef6d5b9ef6c66b0c5fc037c1179db3e7faf21b2c0417dde1e2aa46bb3e1ab1b44849ec9"},
	// NFKC folds the "ﬁ" ligature to "fi" before hashing.
	{"ﬁrst café Ω", "53eb1e642170d90cebee134407c29426:4cda51d636e1740e73ee82f4eada6b120e45a25c41c3e42c7728ac5dec4bbc678d1e78a83e268fe2592b3e437dda5a7ff7f4d18d41d982b7f5bd0d60d11b5f12"},
	// Typed decomposed (e + combining acute); NFKC composes it to "été".
	{"été", "a56a4ff82a4e43d0984071d1028a3865:612a620c59194f84fa681436366fb2fe4e82d2979c44ab0d44c7e96f81d902e188171201b60a558c6215db5cf71d31f56a981fdd66c565aff671082a8210d224"},
}

func TestVerifyPassword_BetterAuthHashes(t *testing.T) {
	for _, f := range betterAuthFixtures {
		if !isBetterAuthHash(f.hash) {
			t.Fatalf("%q should be recognised as a Better Auth hash", f.hash[:10])
		}
		if err := verifyPassword(f.hash, f.password); err != nil {
			t.Errorf("password %q should verify: %v", f.password, err)
		}
		if err := verifyPassword(f.hash, f.password+"x"); err == nil {
			t.Errorf("a wrong password must not verify against %q", f.hash[:10])
		}
	}
	// The composed and decomposed forms of the same text are one password.
	if err := verifyPassword(betterAuthFixtures[2].hash, "été"); err != nil {
		t.Errorf("NFKC-equivalent input should verify: %v", err)
	}
}

func TestVerifyPassword_RejectsMalformedHashes(t *testing.T) {
	for _, hash := range []string{"", "nocolon", ":abcd", "salt:", "salt:not-hex", "salt:abcd", "$argon2id$garbage", "$bcrypt$x"} {
		if err := verifyPassword(hash, "anything"); err == nil {
			t.Errorf("hash %q must not verify", hash)
		}
	}
}

func TestVerifyPassword_Argon2StillWorks(t *testing.T) {
	hash, err := hashPassword("s3cret-passphrase")
	if err != nil {
		t.Fatal(err)
	}
	if isBetterAuthHash(hash) {
		t.Fatal("argon2id hashes must not be mistaken for Better Auth ones")
	}
	if err := verifyPassword(hash, "s3cret-passphrase"); err != nil {
		t.Errorf("argon2id hash should verify: %v", err)
	}
}

func TestLogin_UpgradesBetterAuthHashToArgon2(t *testing.T) {
	f := betterAuthFixtures[0]
	user := &entity.User{ID: "u1", Email: "old@user.org", Role: entity.RoleWatcher}
	auth := &mockAuthRepo{storedHash: f.hash}
	uc := New(&mockUserRepo{existing: user}, auth, &mockEmail{})

	if _, _, err := uc.Login(context.Background(), user.Email, f.password, "1.2.3.4", "test"); err != nil {
		t.Fatalf("a Better Auth user should be able to sign in: %v", err)
	}
	if auth.sessions != 1 {
		t.Error("a session should be created")
	}
	if auth.updatedEmail != user.Email || !strings.HasPrefix(auth.updatedHash, "$argon2id$") {
		t.Fatalf("the hash should be upgraded to argon2id, got %q for %q", auth.updatedHash, auth.updatedEmail)
	}
	if err := verifyPassword(auth.updatedHash, f.password); err != nil {
		t.Errorf("the upgraded hash should verify the same password: %v", err)
	}
}

func TestLogin_WrongPasswordNeitherSignsInNorUpgrades(t *testing.T) {
	user := &entity.User{ID: "u1", Email: "old@user.org"}
	auth := &mockAuthRepo{storedHash: betterAuthFixtures[0].hash}
	uc := New(&mockUserRepo{existing: user}, auth, &mockEmail{})

	_, _, err := uc.Login(context.Background(), user.Email, "wrong", "1.2.3.4", "test")
	if !errors.Is(err, domainerrors.ErrUnauthorized) {
		t.Fatalf("want unauthorized, got %v", err)
	}
	if auth.sessions != 0 || auth.updatedHash != "" {
		t.Error("a failed login must not create a session or touch the hash")
	}
}

func TestLogin_Argon2UserIsNotRehashed(t *testing.T) {
	hash, _ := hashPassword("s3cret-passphrase")
	user := &entity.User{ID: "u1", Email: "new@user.org"}
	auth := &mockAuthRepo{storedHash: hash}
	uc := New(&mockUserRepo{existing: user}, auth, &mockEmail{})

	if _, _, err := uc.Login(context.Background(), user.Email, "s3cret-passphrase", "1.2.3.4", "test"); err != nil {
		t.Fatal(err)
	}
	if auth.updatedHash != "" {
		t.Error("argon2id hashes are already current and shouldn't be rewritten")
	}
}
