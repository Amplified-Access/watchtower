// The social networks the footer has an icon for. Shared by the Studio schema
// (the choice editors get) and the footer (the icon it draws), so no imports:
// the Sanity CLI loads this file too.
export const SOCIAL_PLATFORMS = [
  { value: "linkedin", title: "LinkedIn" },
  { value: "facebook", title: "Facebook" },
  { value: "instagram", title: "Instagram" },
  { value: "youtube", title: "YouTube" },
  { value: "whatsapp", title: "WhatsApp" },
  { value: "x", title: "X" },
  { value: "tiktok", title: "TikTok" },
  { value: "github", title: "GitHub" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["value"];
