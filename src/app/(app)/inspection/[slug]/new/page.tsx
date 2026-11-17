import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/mock/templates";
import { FlatSheetForm } from "./flat-form";
import { PatrolForm } from "./patrol-form";
import { IdsForm } from "./ids-form";

export async function generateStaticParams() {
  return [
    { slug: "cs-01" },
    { slug: "cs-02" },
    { slug: "cs-03" },
    { slug: "cs-04" },
    { slug: "cs-05" },
    { slug: "cs-06" },
  ];
}

/**
 * Form checksheet BARU — header kosong, diisi user.
 * Route: /inspection/[slug]/new
 */
export default async function NewChecksheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getTemplate(slug);
  if (!meta) notFound();

  const { template } = meta;

  switch (template.layout) {
    case "MATRIX_TIME":
      return <PatrolForm template={template} />;
    case "MATRIX_CAVITY":
      return <IdsForm template={template} />;
    case "FLAT_TABLE":
    default:
      return <FlatSheetForm template={template} />;
  }
}
