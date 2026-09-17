"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/logo";
import {
  FaLinkedinIn,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa6";
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("Footer");

  const columns = [
    {
      heading: t("explore"),
      links: [
        { label: t("maps"), href: "/maps" },
        { label: t("reports"), href: "/reports" },
        { label: t("insights"), href: "/insights" },
        { label: t("askWatchtower"), href: "/chat" },
        { label: t("alerts"), href: "/alerts" },
      ],
    },
    {
      heading: t("watchtower"),
      links: [
        { label: t("about"), href: "/about" },
        { label: t("howItWorks"), href: "/about" },
        { label: t("storiesAndInsights"), href: "/insights" },
        { label: t("faqs"), href: "/faqs" },
        { label: t("alert"), href: "/alerts" },
      ],
    },
    {
      heading: t("forOrganisations"),
      links: [
        { label: t("deployments"), href: "/organizations" },
        { label: t("organisationSignIn"), href: "/sign-in" },
        { label: t("createADeployment"), href: "/register-organization" },
      ],
    },
    {
      heading: t("support"),
      links: [
        { label: t("helpCentre"), href: "/help-centre" },
        { label: t("contact"), href: "mailto:hello@amplifiedaccess.org" },
        { label: t("privacyPolicy"), href: "/privacy-policy" },
        { label: t("termsOfUse"), href: "/terms-of-service" },
      ],
    },
  ];

  const socialLinks = [
    { label: "LinkedIn", href: "#", icon: FaLinkedinIn },
    { label: "Facebook", href: "#", icon: FaFacebookF },
    { label: "Instagram", href: "#", icon: FaInstagram },
    { label: "YouTube", href: "#", icon: FaYoutube },
    { label: "WhatsApp", href: "#", icon: FaWhatsapp },
  ];

  return (
    <footer className="relative bg-white py-16 [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-border" />
      <div className="pointer-events-none absolute inset-x-0 bottom-16 h-px bg-border" />
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
        <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
        <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
      </div>
      <div className="mx-auto max-w-360 px-4 md:px-8 xl:px-16">
      <div className="relative isolate overflow-hidden bg-dark text-white @container">
        <div className="relative px-4">
          <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-10 py-8">
            <div className="self-start">
              <Logo color="primary" className="w-40 shrink-0" />
            </div>
            {columns.map((column) => (
              <div key={column.heading} className="flex flex-col gap-4">
                <h3 className="font-title text-sm font-semibold text-white">
                  {column.heading}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mb-5 flex justify-start gap-2 lg:justify-end">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <social.icon className="size-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Watermark */}
        <div className="relative border-t border-white/10 pt-8">
          <Image
            src="/brand/Pattern.svg"
            alt=""
            width={1378}
            height={617}
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-auto w-full opacity-40"
          />
          <div className="px-4">
            {/* h-auto, not a fixed height or an aspect-* class: the box then
                takes its height straight from the viewBox, so x and y scale by
                the same factor. The old width/height attributes plus
                preserveAspectRatio="none" squashed the glyphs vertically to
                roughly 80% and left dead space under the rule. */}
            <svg
              aria-hidden
              viewBox="0 0 1000 130"
              className="pointer-events-none h-auto w-full shrink-0 select-none"
            >
              <text
                x="0"
                y="122"
                textLength="1000"
                lengthAdjust="spacingAndGlyphs"
                className="fill-white/20 font-title font-semibold"
                fontSize="168"
              >
                {t("watchtower")}
              </text>
            </svg>
            <div className="pointer-events-none absolute inset-x-0 bottom-10 h-28 bg-linear-to-b from-transparent to-dark md:h-50" />
          </div>

          <div className="relative px-4 py-5">
            <div className="flex flex-col items-center justify-between gap-3 text-sm text-white/60 sm:flex-row">
              <span>{t("copyright", { year: new Date().getFullYear() })}</span>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy-policy"
                  className="transition-colors hover:text-white"
                >
                  {t("privacyPolicy")}
                </Link>
                <Link
                  href="/terms-of-service"
                  className="transition-colors hover:text-white"
                >
                  {t("termsOfUse")}
                </Link>
                <Link
                  href="/accessibility"
                  className="transition-colors hover:text-white"
                >
                  {t("accessibility")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;
