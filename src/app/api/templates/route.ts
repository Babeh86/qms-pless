import { NextResponse } from "next/server";
import { TEMPLATE_REGISTRY } from "@/lib/mock/templates";
import { requireSession } from "@/server/authz/guard";
import { handleApiError } from "@/lib/api-response";

/**
 * Active controlled template catalog. Cached by the service worker so an inspector
 * can open any active check sheet while the plant network is down.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireSession();

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        items: TEMPLATE_REGISTRY.map((entry) => ({
          slug: entry.slug,
          code: entry.code,
          title: entry.template.title,
          layout: entry.template.layout,
          docNo: entry.template.docNo,
          effectiveDate: entry.template.effectiveDate,
          headerFields: entry.template.header.length,
          itemCount:
            entry.template.layout === "FLAT_TABLE"
              ? entry.template.sections.reduce((sum, section) => sum + section.items.length, 0)
              : entry.template.layout === "MATRIX_TIME"
                ? 19
                : 18,
        })),
      },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
