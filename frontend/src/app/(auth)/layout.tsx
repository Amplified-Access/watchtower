import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Shared shell for sign-in, forgot-password and reset-password: a minimal
// header, gutter lines with the brand dot pattern, and legal links.
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("Footer");

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Same height, padding and black wordmark as the main site header, so
          moving between the site and these pages doesn't jump. */}
      <header className="border-b border-border py-4">
        <div className="mx-auto flex h-9 max-w-360 items-center px-4 md:px-8 xl:px-16 [zoom:var(--viewport-scale)]">
          <Link href="/" aria-label="WatchTower home">
            <Image
              src="/brand/logo-black.svg"
              alt="WatchTower"
              width={219}
              height={37}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="relative isolate flex flex-1 overflow-hidden [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        <Image
          src="/brand/Pattern.svg"
          alt=""
          width={1378}
          height={617}
          className="pointer-events-none absolute -bottom-24 left-1/2 -z-10 h-auto w-full max-w-360 -translate-x-1/2 invert"
        />
        <div className="mx-auto flex w-full max-w-360 items-center justify-center px-8 py-16 md:px-16 md:py-24">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>

      <footer className="border-t border-border [zoom:var(--viewport-scale)]">
        <nav className="flex items-center justify-center gap-2 py-5 font-title text-sm text-primary">
          <Link href="/privacy-policy" className="hover:underline">
            {t("privacy")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms-of-service" className="hover:underline">
            {t("terms")}
          </Link>
          <span aria-hidden>·</span>
          <Link href="/accessibility" className="hover:underline">
            {t("accessibility")}
          </Link>
        </nav>
      </footer>
    </div>
  );
};

export default AuthLayout;
