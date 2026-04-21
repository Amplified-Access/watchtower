export const generateIncidentTypeSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};
