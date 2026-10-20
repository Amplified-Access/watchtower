/**
 * The shape of a form's `definition`, the JSON an admin builds in the form
 * builder and a watcher later fills in.
 *
 * The backend stores it as opaque JSON (`Record<string, unknown>` in
 * `lib/api/forms.ts`), so this describes what the UI actually reads rather
 * than a contract the server enforces. Every field is optional for that
 * reason: an older stored form may not have it.
 */
export interface FormFieldDefinition {
  /** "short-answer", "paragraph", "multiple-choice", "drop-down". */
  type?: string;
  /** The builder writes `title`; older forms use `label`. */
  title?: string;
  label?: string;
  description?: string;
  /** The builder writes a checkbox value, so "on" means the same as true. */
  required?: boolean | "on";
  /** Choices, for the multiple-choice and dropdown types. */
  options?: string[];
}

/**
 * A definition is a map of field key to field. Some older records also carry
 * a title, a description and a `fields` array instead.
 */
export type FormDefinition = {
  title?: string;
  description?: string;
  fields?: FormFieldDefinition[];
} & Record<string, unknown>;

/** Reads a definition of unknown provenance as the map the UI expects. */
export function formFieldEntries(
  definition: unknown,
): [string, FormFieldDefinition][] {
  if (!definition || typeof definition !== "object") return [];
  return Object.entries(definition).filter(
    ([, field]) => field != null && typeof field === "object",
  ) as [string, FormFieldDefinition][];
}
