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
  FaXTwitter,
  FaTiktok,
  FaGithub,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { useTranslations } from "next-intl";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/sanity/social-platforms";
import { useFooterContent } from "./footer-content";

const SOCIAL_ICONS: Record<SocialPlatform, IconType> = {
  linkedin: FaLinkedinIn,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  x: FaXTwitter,
  tiktok: FaTiktok,
  github: FaGithub,
};

// "{organisation}" in the attribution becomes the linked organisation name,
// wherever the language puts it.
const withOrganisation = (text: string, organisation: { name: string; url: string }) =>
  text.split("{organisation}").flatMap((part, i) => [
    ...(i > 0
      ? [
          <a
            key={`org${i}`}
            href={organisation.url || undefined}
            className="whitespace-nowrap text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
          >
            {organisation.name}
          </a>,
        ]
      : []),
    part,
  ]);

// The footer's words, links and social profiles are the `footer` document in
// Sanity (see footer-content.tsx); only the watermark is UI copy.
const Footer = () => {
  const t = useTranslations("Footer");
  const { attribution, organisation, columns, social, copyright, legalLinks } = useFooterContent();

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
          {/* Mobile: logo on its own row, then the four columns as a 2x2 grid,
              instead of wrapping and leaving a gap beside the logo. */}
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-10 py-8 md:flex md:flex-wrap md:justify-between md:gap-x-12">
            <div className="col-span-2 flex max-w-xs flex-col gap-5 self-start">
              <Logo color="primary" className="w-40 shrink-0" />
              {attribution && (
                <p className="text-sm leading-relaxed text-white/60">
                  {withOrganisation(attribution, organisation)}
                </p>
              )}
            </div>
            {columns.map((column) => (
              <div key={column._key} className="flex flex-col gap-4">
                <h3 className="font-title text-sm font-semibold text-white">
                  {column.heading}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link._key}>
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
            {social.map(({ _key, platform, url }) => {
              const Icon = SOCIAL_ICONS[platform];
              if (!Icon) return null;
              return (
                <a
                  key={_key}
                  href={url}
                  aria-label={SOCIAL_PLATFORMS.find((p) => p.value === platform)?.title}
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Icon className="size-3.5" />
                </a>
              );
            })}
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
              <span>{copyright.replace("{year}", String(new Date().getFullYear()))}</span>
              <div className="flex items-center gap-4">
                {legalLinks.map((link) => (
                  <Link
                    key={link._key}
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
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
