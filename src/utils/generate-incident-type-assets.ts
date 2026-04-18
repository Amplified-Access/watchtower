/**
 * Utility functions to generate consistent colors and assets for incident types
 */

// Generate a hash from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate HSL color from incident type name
export function generateIncidentTypeColor(incidentTypeName: string): {
  primary: string;
  secondary: string;
  hex: string;
  tailwindClass: string;
} {
  const hash = hashString(incidentTypeName.toLowerCase());

  // Generate hue (0-360) with good distribution
  const hue = hash % 360;

  // Use consistent saturation and lightness for good visibility
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 45 + (hash % 15); // 45-60%

  const primary = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const secondary = `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`;

  // Convert to hex for easier use
  const hex = hslToHex(hue, saturation, lightness);

  // Generate a Tailwind-compatible class name
  const tailwindClass = `incident-type-${incidentTypeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")}`;

  return {
    primary,
    secondary,
    hex,
    tailwindClass,
  };
}

// Generate marker style configuration
export function generateMarkerStyle(incidentTypeName: string) {
  const colors = generateIncidentTypeColor(incidentTypeName);
  const hash = hashString(incidentTypeName);

  // Generate different marker shapes/styles
  const shapes = ["circle", "square", "triangle", "diamond", "star"];
  const shape = shapes[hash % shapes.length];

  const sizes = ["sm", "md", "lg"];
  const size = sizes[hash % sizes.length];

  return {
    shape,
    size,
    color: colors.hex,
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
    className: `marker-${shape}-${size} ${colors.tailwindClass}`,
  };
}

// Helper function to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate thumbnail configuration
export function generateThumbnailConfig(incidentTypeName: string): {
  backgroundImage: string;
  overlayColor: string;
  iconSuggestion: string;
  gradientDirection: string;
} {
  const colors = generateIncidentTypeColor(incidentTypeName);
  const hash = hashString(incidentTypeName);

  // Categorize incident types to suggest appropriate base images
  const categoryMappings: Record<string, string> = {
    // Violence/Security
    violence: "civilian-violence-map.png",
    attack: "explosions-map.png",
    explosion: "explosions-map.png",
    battle: "battles-map.png",
    conflict: "battles-map.png",

    // Social/Political
    protest: "protests-map.png",
    riot: "riots-map.png",
    demonstration: "protests-map.png",
    censorship: "protests-map.png",
    restriction: "riots-map.png",

    // Digital/Cyber
    cyber: "battles-map.png",
    digital: "battles-map.png",
    online: "battles-map.png",
    website: "battles-map.png",
    social_media: "protests-map.png",

    // Default fallback
    default: "default-map.png",
  };

  // Find matching category
  let backgroundImage = categoryMappings.default;
  const lowerName = incidentTypeName.toLowerCase();

  for (const [keyword, image] of Object.entries(categoryMappings)) {
    if (lowerName.includes(keyword)) {
      backgroundImage = image;
      break;
    }
  }

  // Generate gradient directions
  const gradients = ["to-br", "to-bl", "to-tr", "to-tl", "to-r", "to-l"];
  const gradientDirection = gradients[hash % gradients.length];

  // Suggest icons based on incident type
  const iconSuggestions: Record<string, string> = {
    censorship: "eye-off",
    violence: "alert-triangle",
    protest: "users",
    cyber: "shield",
    explosion: "zap",
    default: "map-pin",
  };

  let iconSuggestion = iconSuggestions.default;
  for (const [keyword, icon] of Object.entries(iconSuggestions)) {
    if (lowerName.includes(keyword)) {
      iconSuggestion = icon;
      break;
    }
  }

  return {
    backgroundImage: `/images/maps/${backgroundImage}`,
    overlayColor: colors.primary,
    iconSuggestion,
    gradientDirection,
  };
}

// Generate complete asset configuration for an incident type
export function generateIncidentTypeAssets(incidentTypeName: string) {
  return {
    colors: generateIncidentTypeColor(incidentTypeName),
    marker: generateMarkerStyle(incidentTypeName),
    thumbnail: generateThumbnailConfig(incidentTypeName),
    slug: incidentTypeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim(),
  };
}
