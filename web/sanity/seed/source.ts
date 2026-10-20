// English source for the initial import, carried over from the placeholder
// modules the frontend used before Sanity (features/case-studies/data and
// features/legal/content). After `pnpm seed`, Sanity is the source of truth:
// edit content in the Studio, not here.

export type CaseStudyCategory =
  | "climate"
  | "water-sanitation"
  | "rights-safety"
  | "public-services";

// Body content for the detail page, in reading order.
export type CaseStudyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "stats"; items: { value: string; unit?: string; label: string }[] }
  | { type: "mapLink"; href: string };

export interface CaseStudy {
  slug: string;
  title: string;
  summary: string;
  category: CaseStudyCategory;
  location: string;
  publishedAt: string;
  imageUrl: string;
  imageAlt: string;
  /** Deployment the study came from, shown in the detail page meta line. */
  deployment?: string;
  /** Full write-up. Studies without one show their summary as the introduction. */
  body?: CaseStudyBlock[];
  /** Shown in the featured block above the filters instead of the main list. */
  featured?: boolean;
}

const COMMUNITY_IMAGE = {
  imageUrl: "/case-studies/placeholder-community.webp",
  imageAlt: "Brightly painted houses stacked across a hillside",
};

const MARKET_IMAGE = {
  imageUrl: "/case-studies/placeholder-market.webp",
  imageAlt: "A crowded market street at sunset",
};

const CHILDREN_IMAGE = {
  imageUrl: "/case-studies/placeholder-children.webp",
  imageAlt: "Two smiling children standing in front of a corrugated metal wall",
};

export const PLACEHOLDER_CASE_STUDIES: CaseStudy[] = [
  {
    slug: "water-access-kampala",
    featured: true,
    title: "When access to water becomes uncertain",
    summary: "Listening to what communities are reporting about water access in Kampala",
    category: "water-sanitation",
    location: "Kampala, Uganda",
    deployment: "Community Water Watch",
    publishedAt: "2026-09-10",
    ...MARKET_IMAGE,
    body: [
      { type: "heading", text: "Introduction" },
      {
        type: "paragraph",
        text: "Across communities in Kampala, access to water can change from one day to the next. Interruptions, unreliable supply and concerns about water quality can affect households differently depending on where they live and the services available to them.",
      },
      {
        type: "paragraph",
        text: "Through Community Water Watch, WatchTower provides a way for people to report these experiences in the languages they are most comfortable using, helping individual accounts become part of a broader picture of what communities are experiencing.",
      },
      { type: "quote", text: "We sometimes go days without knowing when the water will return." },
      {
        type: "paragraph",
        text: "One report captures one person's experience. But when similar reports begin appearing across different places and at different times, they can reveal something more.",
      },
      {
        type: "paragraph",
        text: "Community Water Watch was created to bring these experiences together and make them easier to understand.",
      },
      { type: "heading", text: "Hearing what the numbers can miss" },
      {
        type: "paragraph",
        text: "Traditional data can tell us a great deal about infrastructure and service delivery. But it may not always capture what unreliable access feels like at household and community level.",
      },
      {
        type: "paragraph",
        text: "People describe the days without water, the distances travelled to find alternatives, changes in water quality and the ways interruptions affect everyday life.",
      },
      {
        type: "paragraph",
        text: "Community reporting creates another layer of evidence, one grounded in what people are seeing and experiencing themselves.",
      },
      { type: "image", src: MARKET_IMAGE.imageUrl, alt: MARKET_IMAGE.imageAlt },
      { type: "heading", text: "How we listened" },
      {
        type: "paragraph",
        text: "Community Water Watch used WatchTower to make reporting accessible across languages and locations.",
      },
      { type: "subheading", text: "Reporting in familiar languages:" },
      {
        type: "paragraph",
        text: "People could submit reports in the languages they were most comfortable using, reducing the need for communities to translate their experiences before sharing them.",
      },
      { type: "subheading", text: "Voice and text reporting:" },
      {
        type: "paragraph",
        text: "Reports could be shared through text or voice, giving people different ways to describe what was happening.",
      },
      { type: "subheading", text: "Translation and organisation:" },
      {
        type: "paragraph",
        text: "WatchTower helped transcribe, translate and organise reports so that information submitted in different languages could be understood together.",
      },
      { type: "subheading", text: "Connecting related reports:" },
      {
        type: "paragraph",
        text: "Reports could then be explored across location, time and incident type, helping recurring reporting patterns become easier to identify.",
      },
      { type: "subheading", text: "Privacy by design:" },
      {
        type: "paragraph",
        text: "Personal information and precise locations can be limited or generalised where necessary to help protect people submitting reports.",
      },
      { type: "heading", text: "A picture began to emerge" },
      {
        type: "paragraph",
        text: "As reports accumulated, individual experiences started to connect.",
      },
      {
        type: "stats",
        items: [
          { value: "42", label: "Related reports" },
          { value: "08", label: "Communities" },
          { value: "03", label: "Languages" },
          { value: "06", unit: "months", label: "Reporting period" },
        ],
      },
      { type: "heading", text: "Where reports came from" },
      {
        type: "paragraph",
        text: "Reports were submitted from communities across Kampala, with concentrations of reporting around water availability, service interruptions and water quality.",
      },
      { type: "mapLink", href: "/maps/live-incident-map" },
      { type: "heading", text: "From evidence to action" },
      {
        type: "paragraph",
        text: "Listening is only useful if what communities share can inform what happens next.",
      },
      {
        type: "paragraph",
        text: "The evidence generated through Community Water Watch can support conversations between communities, organisations and other stakeholders working on water access.",
      },
      {
        type: "paragraph",
        text: "Reports can provide additional context for investigation, advocacy, planning, coordination and accountability.",
      },
      { type: "heading", text: "Why it matters" },
      {
        type: "paragraph",
        text: "The people closest to an incident often understand dimensions of it that aggregate numbers alone cannot show.",
      },
      {
        type: "paragraph",
        text: "Community reporting provides a way to capture those experiences as they happen.",
      },
      {
        type: "paragraph",
        text: "When people can report in their own languages and those reports can be understood, connected and explored together, individual voices can contribute to a clearer understanding of what is happening on the ground.",
      },
    ],
  },
  {
    slug: "changing-seasons-everyday-life",
    featured: true,
    title: "When changing seasons reshape everyday life",
    summary:
      "How community voices are helping build a clearer picture of changing climate conditions.",
    category: "climate",
    location: "Kenya",
    publishedAt: "2026-09-08",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "access-to-public-services",
    title: "What communities are telling us about access to public services",
    summary:
      "Connecting reports across places to understand recurring experiences and service gaps.",
    category: "public-services",
    location: "East Africa",
    publishedAt: "2026-09-08",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "water-points-running-dry",
    title: "Tracking water points that run dry between rains",
    summary:
      "Reports from neighbouring villages reveal where water access breaks down first.",
    category: "water-sanitation",
    location: "Uganda",
    publishedAt: "2026-09-01",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "safer-routes-to-market",
    title: "Mapping safer routes to the market",
    summary:
      "How repeated safety reports helped a community document where risks concentrate.",
    category: "rights-safety",
    location: "Tanzania",
    publishedAt: "2026-08-27",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "sanitation-in-growing-settlements",
    title: "Sanitation gaps in fast-growing settlements",
    summary:
      "Residents describe how infrastructure has not kept pace with new neighbourhoods.",
    category: "water-sanitation",
    location: "Kenya",
    publishedAt: "2026-08-19",
    ...COMMUNITY_IMAGE,
  },
  {
    slug: "clinic-waiting-times",
    title: "What reports reveal about clinic waiting times",
    summary:
      "Patterns across districts point to the services communities struggle to reach.",
    category: "public-services",
    location: "Rwanda",
    publishedAt: "2026-08-12",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "floods-and-displacement",
    title: "Floods, displacement and the voices in between",
    summary:
      "Community accounts help explain how extreme weather disrupts daily routines.",
    category: "climate",
    location: "Ethiopia",
    publishedAt: "2026-08-04",
    ...CHILDREN_IMAGE,
  },
  {
    slug: "documenting-rights-concerns",
    title: "Documenting rights concerns in the languages people speak",
    summary:
      "Multilingual reporting surfaces incidents that would otherwise go unrecorded.",
    category: "rights-safety",
    location: "Pakistan",
    publishedAt: "2026-07-29",
    ...COMMUNITY_IMAGE,
  },
];

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

// The terms of use: plain language, written for WatchTower (anonymous civic
// reporting, organisation deployments, AI translation and chat, public maps).
// Like the privacy policy, English only until a reviewed translation exists.
export const TERMS_OF_USE_LAST_UPDATED = "2026-10-04";

export const TERMS_OF_USE_SECTIONS: PolicySection[] = [
  {
    id: "about-these-terms",
    title: "About These Terms",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower is a multilingual civic reporting platform operated by Amplified Access. These terms explain the rules for using WatchTower, including the website, the report form, the maps, alerts, the Ask WatchTower assistant and organisation accounts.",
      },
      {
        type: "paragraph",
        text: "By using WatchTower, you agree to these terms. If you use WatchTower on behalf of an organisation, you confirm that you are allowed to accept these terms for that organisation.",
      },
      {
        type: "paragraph",
        text: "Our privacy policy explains what information we collect and how we use it, and forms part of these terms.",
      },
      { type: "link", text: "Read the privacy policy", href: "/privacy-policy" },
    ],
  },
  {
    id: "not-an-emergency-service",
    title: "WatchTower Is Not an Emergency Service",
    blocks: [
      {
        type: "emphasis",
        text: "If you or someone else is in immediate danger, contact your local emergency services or a trusted person nearby.",
      },
      {
        type: "paragraph",
        text: "Reports are not monitored around the clock, and submitting a report does not guarantee that anyone will respond. A report on WatchTower is not an official complaint to the police, a court or any government authority.",
      },
    ],
  },
  {
    id: "using-watchtower",
    title: "Using WatchTower",
    blocks: [
      {
        type: "paragraph",
        text: "You may use WatchTower for lawful purposes and in line with these terms. If you are not yet an adult where you live, please use WatchTower with the knowledge of a parent, guardian or another trusted adult.",
      },
      {
        type: "paragraph",
        text: "We may change, add or remove features, and WatchTower may sometimes be unavailable, for example during maintenance.",
      },
    ],
  },
  {
    id: "your-safety",
    title: "Your Safety",
    blocks: [
      {
        type: "paragraph",
        text: "You decide what to share. Before you submit a report, think about whether its details could identify you or put you or others at risk.",
      },
      {
        type: "list",
        items: [
          "You do not need to give your name or phone number to submit a public report.",
          "Avoid including details that identify you or other people unless they are necessary.",
          "Anonymous reporting reduces risk but cannot remove it. Someone may recognise you from what a report describes, or from the device or network you use.",
        ],
      },
    ],
  },
  {
    id: "your-reports",
    title: "Your Reports and Content",
    blocks: [
      {
        type: "paragraph",
        text: "You are responsible for what you submit. Reports should be accurate to the best of your knowledge, and you must have the right to share any photos, files or other material you upload.",
      },
      {
        type: "paragraph",
        text: "You keep any rights you have in your reports. By submitting one, you give Amplified Access a worldwide, non-exclusive, royalty-free permission to store, translate, transcribe, review, edit for privacy, display, analyse and share it, as described in our privacy policy, to run WatchTower and support its civic purpose, such as research, advocacy and accountability.",
      },
      {
        type: "paragraph",
        text: "Information that has been combined with other reports or anonymised, such as counts, trends and maps, may remain available after an individual report is removed.",
      },
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    blocks: [
      {
        type: "list",
        title: "When using WatchTower, you must not:",
        items: [
          "Submit reports you know to be false or misleading",
          "Harass, threaten or abuse anyone, or encourage violence or hatred",
          "Share someone's personal information to expose, target or harm them",
          "Try to identify, locate or retaliate against people who submit reports or are named in them",
          "Share content that sexualises children, or other illegal content",
          "Pretend to be another person or organisation",
          "Send spam or automated mass submissions",
          "Upload malware, interfere with WatchTower's operation, or try to get around access controls",
          "Use WatchTower for any unlawful purpose",
        ],
      },
      {
        type: "paragraph",
        text: "If you find a security vulnerability, please report it responsibly as described in our security policy instead of testing it on the live service.",
      },
      { type: "link", text: "Read the security policy", href: "/security" },
    ],
  },
  {
    id: "review-and-moderation",
    title: "Review and Moderation",
    blocks: [
      {
        type: "paragraph",
        text: "To keep WatchTower safe and useful, reports may be reviewed, verified, translated and edited for privacy, for example by removing identifying details or making a location less precise. We may decline to publish, hide or remove any report or content, including content that breaks these terms or could put someone at risk.",
      },
      {
        type: "paragraph",
        text: "We do not review every report before it appears, and publishing a report does not mean that WatchTower or Amplified Access has verified or endorses it.",
      },
    ],
  },
  {
    id: "organisation-accounts",
    title: "Organisation Accounts",
    blocks: [
      {
        type: "paragraph",
        text: "Organisations can create deployments and accounts to receive, manage and analyse reports. If you have an organisation account:",
      },
      {
        type: "list",
        items: [
          "Keep your login details secure, and tell us promptly if you think your account has been misused",
          "You are responsible for activity on your account and for the people you invite to it",
          "Treat reports confidentially, use them only for your deployment's purpose, and handle personal information in line with the data protection laws that apply to you",
          "Do not use reports or reporters' information in ways that could expose them to harm",
        ],
      },
    ],
  },
  {
    id: "automated-features",
    title: "Translation, AI and Automated Features",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower uses automated tools, including AI models, to translate and transcribe reports, organise and categorise them, and answer questions in the Ask WatchTower assistant.",
      },
      {
        type: "paragraph",
        text: "These tools can make mistakes. Their output may be inaccurate or incomplete and is not legal, medical or safety advice. Check important information before relying on it.",
      },
    ],
  },
  {
    id: "maps-and-information",
    title: "Maps, Insights and Information",
    blocks: [
      {
        type: "paragraph",
        text: "The maps, insights and other information on WatchTower are based on reports from the community. They may be unverified, incomplete, approximate or out of date, and they show what has been reported, not everything that has happened.",
      },
      {
        type: "paragraph",
        text: "Use this information for awareness, research and advocacy, not as the only basis for decisions that affect someone's safety or legal rights. If you reuse it, credit WatchTower and do not try to identify the people behind the reports.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Open Source and Intellectual Property",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower's source code is open source under the MIT licence, which sets out how you may use, copy and change it.",
      },
      { type: "link", text: "View the source code", href: "https://github.com/Amplified-Access/watchtower" },
      {
        type: "paragraph",
        text: "The WatchTower and Amplified Access names and logos, and the site's own text and design, belong to Amplified Access or its licensors. The open-source licence does not give you the right to use them in a way that suggests you are WatchTower or are endorsed by Amplified Access.",
      },
    ],
  },
  {
    id: "third-party-services",
    title: "Third-Party Services",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower relies on services from other companies, for example for maps, location search, translation, AI and hosting, and it links to other websites. Their own terms and policies apply to them, and we are not responsible for websites we do not run.",
      },
    ],
  },
  {
    id: "suspension-and-termination",
    title: "Suspension and Termination",
    blocks: [
      {
        type: "paragraph",
        text: "We may suspend or restrict access to WatchTower, or close an account, if we reasonably believe these terms have been broken or that doing so is needed to protect people, reports or the service.",
      },
      {
        type: "paragraph",
        text: "You can stop using WatchTower at any time. Organisations can ask us to close their account by contacting us.",
      },
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    blocks: [
      {
        type: "paragraph",
        text: "WatchTower is provided free of charge, \"as is\" and \"as available\". As far as the law allows, we make no promises that it will always be available, secure or free of errors, or that information on it is accurate or complete.",
      },
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    blocks: [
      {
        type: "paragraph",
        text: "As far as the law allows, Amplified Access is not liable for any indirect or consequential loss, for loss of data, or for harm caused by what other people submit to WatchTower or do with information from it.",
      },
      {
        type: "paragraph",
        text: "Nothing in these terms limits any liability or rights that cannot be limited under the law that applies to you.",
      },
    ],
  },
  {
    id: "changes-to-these-terms",
    title: "Changes to These Terms",
    blocks: [
      {
        type: "paragraph",
        text: "We may update these terms as WatchTower changes. The date at the top of this page shows when they last changed, and we will make significant changes clear on the site. If you keep using WatchTower after a change, the updated terms apply.",
      },
      {
        type: "paragraph",
        text: "These terms may be offered in several languages. If a translation differs from the English version, the English version applies.",
      },
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    blocks: [
      { type: "paragraph", text: "If you have questions about these terms, contact Amplified Access." },
      {
        type: "contact",
        items: [
          { label: "Email", email: "hello@amplifiedaccess.org" },
          { label: "General Support", email: "support@amplifiedaccess.org" },
        ],
      },
    ],
  },
];
