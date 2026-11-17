import { cs01, cs02, cs03, cs04, type ChecksheetTemplate } from "./templates-flat";
import { cs05, cs06 } from "./templates-matrix";

export * from "./templates-flat";
export * from "./templates-matrix";

export interface TemplateMeta {
  slug: string;
  code: string;
  template: ChecksheetTemplate;
}

/** Registry 6 checksheet — dipakai routing /inspection/[slug]. */
export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  { slug: "cs-01", code: "CS-01", template: cs01 },
  { slug: "cs-02", code: "CS-02", template: cs02 },
  { slug: "cs-03", code: "CS-03", template: cs03 },
  { slug: "cs-04", code: "CS-04", template: cs04 },
  { slug: "cs-05", code: "CS-05", template: cs05 },
  { slug: "cs-06", code: "CS-06", template: cs06 },
];

export function getTemplate(slug: string): TemplateMeta | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.slug === slug);
}
