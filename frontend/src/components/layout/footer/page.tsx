import Link from "next/link";
import Logo from "@/components/logo";
import { Mail } from "lucide-react";
import TextComponent from "@/components/common/text-component";

const footerLinks = {
  platform: {
    heading: "Platform",
    links: [
      { label: "About", href: "/about" },
      { label: "Maps", href: "/maps" },
      { label: "Chat", href: "/chat" },
      { label: "Alerts", href: "/alerts" },
      // { label: "Submit a report", href: "/anonymous-reports" },
    ],
  },
  contact: {
    heading: "Contact us",
    links: [
      {
        label: "hello@amplifiedaccess.org",
        href: "mailto:hello@amplifiedaccess.org",
      },
    ],
  },
};

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:pb-20">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 md:gap-8">
          {/* Brand column */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div>
              <Logo color="primary" className="w-52" />
            </div>
            <TextComponent className="text-white mt-1 text-sm md:text-base">
              Empowering communities to report civic incidents in their own
              language, so everyone can participate in civic life and public
              accountability.
            </TextComponent>
          </div>

          {/* Links group — Platform + Contact bundled to the right */}
          <div className="flex gap-12 md:gap-16 shrink-0">
            {/* Platform */}
            <div className="flex flex-col gap-4">
              <h3 className="font-title font-semibold text-sm text-white">
                {footerLinks.platform.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {footerLinks.platform.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white hover:opacity-70 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <h3 className="font-title font-semibold text-sm text-white">
                {footerLinks.contact.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {footerLinks.contact.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-white hover:opacity-70 transition-opacity"
                    >
                      {link.href.startsWith("mailto:") && (
                        <Mail size={14} className="shrink-0" />
                      )}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>© 2026 Amplified Access. All rights reserved.</span>
            {/* <span className="hidden sm:inline text-white/30">·</span>
            <span>
              Designed and built by{" "}
              <a
                href="https://amplifiedaccess.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Amplified Access
              </a> */}
            {/* </span> */}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="hover:opacity-70 transition-opacity"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:opacity-70 transition-opacity"
            >
              Terms
            </Link>
            <Link
              href="/cookie-policy"
              className="hover:opacity-70 transition-opacity"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
