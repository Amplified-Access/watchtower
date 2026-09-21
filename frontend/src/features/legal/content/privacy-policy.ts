// Privacy policy body, transcribed from the Figma. Kept in English only on
// purpose: legal text needs a reviewed translation, not machine copy in
// messages/*.json. The page chrome around it (hero, table of contents label)
// is translated.
//
// The design's table of contents also lists "Children & Young People" and
// "Changes to This Policy", but the design has no copy for them, so they are
// left out until that text is written.

/** Month the policy text last changed (shown as "Last updated: September 2026"). */
export const PRIVACY_POLICY_LAST_UPDATED = "2026-09-01";

export type PolicyBlock =
  | { type: "paragraph"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "list"; title?: string; items: string[] }
  | { type: "definitions"; items: { term: string; description: string }[] }
  | { type: "link"; text: string; href: string }
  | { type: "contact"; items: { label: string; email: string }[] };

export interface PolicySection {
  id: string;
  title: string;
  blocks: PolicyBlock[];
}

export const PRIVACY_POLICY_SECTIONS: PolicySection[] = [
  {
    id: "overview",
    title: "Overview",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower is a multilingual reporting and civic intelligence tool developed by Amplified Access.",
      },
      {
        type: "paragraph",
        text: "The platform enables people to report civic incidents and rights violations in the languages they speak and helps organise, map, and analyse reports so that patterns can be better understood.",
      },
      {
        type: "paragraph",
        text: "We understand that civic reporting may involve sensitive information. WatchTower is therefore designed to provide users with clear choices about what information they share and how their reports are handled.",
      },
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    blocks: [
      {
        type: "paragraph",
        text: "Depending on how you use WatchTower, information may include:",
      },
      {
        type: "list",
        title: "Information you choose to submit",
        items: [
          "The content of your report",
          "The language used",
          "Location information",
          "Date and time of an incident",
          "Photos, files, or other supporting evidence",
          "Any additional information you voluntarily provide",
        ],
      },
      {
        type: "definitions",
        items: [
          {
            term: "Account information",
            description:
              "If you create or use an organisation account, WatchTower may collect information required to manage that account, such as your name, email address, organisation, and login details.",
          },
        ],
      },
      {
        type: "emphasis",
        text: "You do not need to provide your name or phone number to submit a public report.",
      },
    ],
  },
  {
    id: "anonymous-reporting",
    title: "Anonymous Reporting",
    blocks: [
      { type: "paragraph", text: "WatchTower supports anonymous reporting." },
      {
        type: "paragraph",
        text: "You may be able to submit a report without creating an account or providing personally identifying information.",
      },
      {
        type: "paragraph",
        text: "However, users should avoid including personal information within the report itself unless they understand and accept the risks of sharing it.",
      },
    ],
  },
  {
    id: "location-information",
    title: "Location Information",
    blocks: [
      {
        type: "paragraph",
        text: "Some reports may include location information to help users understand where an incident occurred.",
      },
      {
        type: "paragraph",
        text: "For privacy and safety reasons, WatchTower may limit, generalise, or approximate location information displayed publicly.",
      },
      { type: "paragraph", text: "For example:" },
      {
        type: "definitions",
        items: [
          { term: "Exact location", description: "Used internally where appropriate." },
          {
            term: "Generalised location",
            description: "Displayed publicly when needed for privacy.",
          },
        ],
      },
    ],
  },
  {
    id: "how-information-is-used",
    title: "How Information Is Used",
    blocks: [
      { type: "paragraph", text: "Information submitted through WatchTower may be used to:" },
      {
        type: "list",
        items: [
          "Display and organise reports",
          "Translate or transcribe multilingual reports",
          "Identify related reports",
          "Map reporting activity",
          "Support verification and review",
          "Identify trends and recurring patterns",
          "Generate insights",
          "Support research, advocacy, coordination, and accountability",
          "Improve the WatchTower platform",
        ],
      },
    ],
  },
  {
    id: "who-can-see-reports",
    title: "Who Can See Reports",
    blocks: [
      {
        type: "paragraph",
        text: "Visibility may depend on the type of report, deployment, privacy settings, and safety considerations.",
      },
      { type: "paragraph", text: "A report may be:" },
      {
        type: "definitions",
        items: [
          { term: "Public", description: "Visible to users exploring WatchTower." },
          { term: "Limited", description: "Visible only to authorised organisations or users." },
          { term: "Private", description: "Restricted because of sensitivity or privacy concerns." },
        ],
      },
    ],
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower may allow authorised organisations, researchers, or other approved users to access information where appropriate.",
      },
      {
        type: "paragraph",
        text: "Where possible, access should be limited to the information necessary for the intended purpose.",
      },
      { type: "paragraph", text: "WatchTower should not sell personal information." },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower uses appropriate technical and organisational measures to help protect information from unauthorised access, misuse, loss, or disclosure.",
      },
      {
        type: "paragraph",
        text: "However, no digital platform can guarantee absolute security.",
      },
    ],
  },
  {
    id: "your-choices",
    title: "Your Choices",
    blocks: [
      { type: "paragraph", text: "Depending on your use of WatchTower, you may be able to:" },
      {
        type: "list",
        items: [
          "Report anonymously",
          "Choose whether to provide identifying information",
          "Control what evidence you upload",
          "Select your preferred language",
          "Request access to or correction of account information",
          "Request deletion where applicable",
          "Manage alerts and communication preferences",
        ],
      },
      { type: "paragraph", text: "Questions about your information?" },
      { type: "link", text: "Contact us", href: "#contact-us" },
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower may retain information for as long as necessary to support reporting, analysis, accountability, legal obligations, or platform operation. Retention periods may vary depending on the type of information and how it is used.",
      },
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    blocks: [
      {
        type: "paragraph",
        text: "If you have questions about privacy, data handling, or your information, contact Amplified Access.",
      },
      {
        type: "contact",
        items: [
          { label: "Email", email: "privacy@amplifiedaccess.org" },
          { label: "General Support", email: "support@amplifiedaccess.org" },
        ],
      },
    ],
  },
];
