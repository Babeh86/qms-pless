import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, judgmentTone } from "@/components/ui/badge";
import type { Checksheet } from "@/lib/mock/types";
import type { ChecksheetTemplate } from "@/lib/mock/templates-flat";
import { IDS_CAVITY_COUNT, IDS_ROWS, PATROL_CHARA, PATROL_SLOTS } from "@/lib/mock/templates-matrix";
import { materialById, partnerByCode, parts } from "@/lib/mock/data";

/**
 * Read-only rendering of a persisted (or bundled sample) check sheet.
 * Every cell comes from the document's own snapshot — never from live master data.
 */

function isNg(doc: Checksheet, index: number) {
  return doc.finalJudgment === "NG" && index < doc.ngItems;
}

function savedValue(doc: Checksheet, key: string, index: number, fallback: string) {
  const snapshotValue = doc.itemSnapshot?.[key];
  if (snapshotValue !== undefined) return snapshotValue;
  if (isNg(doc, index)) return "NG";
  return fallback;
}

function flatValue(
  doc: Checksheet,
  item: ChecksheetTemplate["sections"][number]["items"][number],
  key: string,
  index: number,
) {
  const fallback =
    item.inputType === "JUDGEMENT" ? "OK" : (item.exampleValue ?? item.standardText ?? "OK");
  return savedValue(doc, key, index, fallback);
}

function cellClass(value: string) {
  if (value === "NG") return "bg-rose-100 text-rose-700";
  if (value === "NA") return "bg-slate-100 text-slate-500";
  return "bg-emerald-100 text-emerald-700";
}

export async function ChecksheetRecord({
  doc,
  template,
}: {
  doc: Checksheet;
  template: ChecksheetTemplate;
}) {
  const t = await getTranslations("form");

  if (template.layout === "MATRIX_TIME") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2">
                    {t("timeColumn")}
                  </th>
                  {PATROL_CHARA.map((chara) => (
                    <th
                      key={chara.no}
                      title={chara.text}
                      className="min-w-10 border-l border-slate-200 px-1 py-2 text-center"
                    >
                      {chara.no}
                    </th>
                  ))}
                  <th className="border-l border-slate-200 px-3 py-2">{t("remarkColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {PATROL_SLOTS.map((slot, rowIndex) => (
                  <tr key={slot} className="border-t border-slate-100">
                    <th className="sticky left-0 bg-white px-3 py-2 font-mono font-semibold">
                      {slot}
                    </th>
                    {PATROL_CHARA.map((chara, colIndex) => {
                      const key = `patrol:${slot}:${chara.no}`;
                      const value = savedValue(
                        doc,
                        key,
                        rowIndex * PATROL_CHARA.length + colIndex,
                        "OK",
                      );
                      return (
                        <td key={chara.no} className="border-l border-slate-100 px-1 py-1 text-center">
                          <span
                            className={
                              "inline-flex min-w-7 justify-center rounded px-1.5 py-1 text-[9px] font-bold " +
                              cellClass(value)
                            }
                          >
                            {value}
                          </span>
                        </td>
                      );
                    })}
                    <td className="border-l border-slate-100 px-3 py-2 text-slate-500">
                      {doc.itemSnapshot?.[`remark:${slot}`] ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[9px] text-slate-500">
            <span>
              {t("inspectionPoints")}: {PATROL_CHARA.length}
            </span>
            <span>
              {t("timeSlots")}: {PATROL_SLOTS.length}
            </span>
            <span className="ml-auto">
              {doc.ngItems} {t("ngFindings")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (template.layout === "MATRIX_CAVITY") {
    const cavities = Array.from({ length: IDS_CAVITY_COUNT }, (_, index) => index + 1);
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-[10px]">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 px-2 py-2">{t("no")}</th>
                  <th className="px-2 py-2">{t("itemColumn")}</th>
                  <th className="px-2 py-2">{t("dimensionStandard")}</th>
                  <th className="px-2 py-2">{t("tolerance")}</th>
                  <th className="px-2 py-2">{t("frequency")}</th>
                  <th className="px-2 py-2">{t("tool")}</th>
                  <th className="px-2 py-2">{t("area")}</th>
                  {cavities.map((cavity) => (
                    <th
                      key={cavity}
                      className="border-l border-slate-200 bg-blue-50 px-1.5 py-2 text-center"
                    >
                      C{cavity}
                    </th>
                  ))}
                  <th className="border-l border-slate-200 px-2 py-2">{t("judgeColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {IDS_ROWS.map((row, rowIndex) => {
                  const values = cavities.map((cavity) =>
                    savedValue(
                      doc,
                      `ids:${rowIndex}:${cavity}`,
                      rowIndex,
                      row.inputType === "NUMBER" ? row.dimension : "OK",
                    ),
                  );
                  const hasNg = values.some(
                    (value) =>
                      value === "NG" ||
                      (row.inputType === "NUMBER" &&
                        row.rangeMin !== undefined &&
                        Number(value) > (row.rangeMax ?? Number.POSITIVE_INFINITY)),
                  );
                  const judge: "OK" | "NG" | null = hasNg
                    ? "NG"
                    : values.some((value) => value === "")
                      ? null
                      : "OK";

                  return (
                    <tr key={`${row.no}-${row.area}-${rowIndex}`} className="border-t border-slate-100">
                      <td className="sticky left-0 bg-white px-2 py-2 font-mono">{row.no}</td>
                      <td className="px-2 py-2 font-semibold">{row.itemCheck}</td>
                      <td className="px-2 py-2">{row.dimension}</td>
                      <td className="px-2 py-2">{row.range ?? "—"}</td>
                      <td className="px-2 py-2">{row.freq}</td>
                      <td className="px-2 py-2">{row.tool}</td>
                      <td className="px-2 py-2">{row.area}</td>
                      {values.map((value, cavityIndex) => (
                        <td
                          key={cavities[cavityIndex]}
                          className="border-l border-slate-100 px-1 py-1 text-center"
                        >
                          <span
                            className={
                              "inline-flex min-w-10 justify-center rounded px-1 py-1 font-mono " +
                              cellClass(value)
                            }
                          >
                            {value}
                          </span>
                        </td>
                      ))}
                      <td className="border-l border-slate-100 px-2 py-1 text-center">
                        <Badge tone={judgmentTone(judge)}>{judge ?? "—"}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {template.sections.map((section, sectionIndex) => (
        <Card key={`${section.title}-${sectionIndex}`} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
            <h2 className="text-xs font-bold text-slate-800">{section.title}</h2>
            <span className="text-[9px] text-slate-400">
              {t("itemsCount", { count: section.items.length })}
            </span>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                    <th className="px-3 py-2">{t("no")}</th>
                    <th className="px-3 py-2">{t("itemColumn")}</th>
                    <th className="px-3 py-2">{t("standard")}</th>
                    <th className="px-3 py-2">{t("actualResult")}</th>
                    <th className="px-3 py-2 text-center">{t("judgeColumn")}</th>
                    <th className="px-3 py-2">{t("remarkColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map((item, itemIndex) => {
                    const key = `flat:${sectionIndex}:${itemIndex}`;
                    const value = flatValue(doc, item, key, sectionIndex * 100 + itemIndex);
                    const outOfRange =
                      item.inputType === "NUMBER" &&
                      item.rangeMin !== undefined &&
                      (Number(value) < item.rangeMin ||
                        Number(value) > (item.rangeMax ?? Number.POSITIVE_INFINITY));
                    const judgment: "OK" | "NG" = value === "NG" || outOfRange ? "NG" : "OK";

                    return (
                      <tr key={key} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                          {item.no ?? itemIndex + 1}
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">{item.detailCheck}</p>
                          {item.tool ? (
                            <p className="mt-0.5 text-[9px] text-slate-400">{item.tool}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.standardText ?? item.standardValue ?? "—"}
                          {item.rangeMin !== undefined ? (
                            <span className="block text-[9px] text-slate-400">
                              {item.rangeMin} – {item.rangeMax}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700">{value}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge tone={judgmentTone(judgment)}>{judgment}</Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {doc.remarksSnapshot?.[`remark:${key}`] ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Bundled sample documents have no snapshot, so build a deterministic legacy view.
 * Persisted documents always use their own stored snapshot.
 */
export function checksheetHeaderSnapshot(doc: Checksheet): Record<string, string> {
  const part = parts.find((entry) => entry.partNo === doc.partNo);
  const material = part ? materialById(part.materialId) : undefined;

  return {
    partNo: doc.partNo,
    partName: doc.partName,
    supplier: partnerByCode(doc.supplierCode)?.name ?? doc.supplierCode ?? "",
    customer: doc.customerName ?? "",
    material: material
      ? [material.name, material.additiveMasterbatch, material.color].filter(Boolean).join(" ")
      : "",
    color: material?.color ?? "",
    model: part?.model ?? "",
    cavity: part ? String(part.defaultCavityCount) : "",
    moldCode: part?.moldCode ?? "",
    drawingRev: part?.drawingRev ?? "",
    machineNo: doc.machineNo ?? "",
    lotNo: doc.lotNo,
    inspectionDate: doc.inspectionDate,
    date: doc.inspectionDate,
    kedatanganDate: doc.inspectionDate,
    totalQty: String(doc.totalItems * 10),
    samplingQty: String(doc.totalItems),
    ...(doc.headerSnapshot ?? {}),
  };
}

export function checksheetItemSnapshot(
  doc: Checksheet,
  template: ChecksheetTemplate,
): Record<string, string> {
  if (doc.itemSnapshot) return doc.itemSnapshot;

  const snapshot: Record<string, string> = {};
  let index = 0;

  if (template.layout === "MATRIX_TIME") {
    for (const slot of PATROL_SLOTS) {
      for (const chara of PATROL_CHARA) {
        snapshot[`patrol:${slot}:${chara.no}`] = isNg(doc, index) ? "NG" : "OK";
        index += 1;
      }
      snapshot[`remark:${slot}`] = "—";
    }
    return snapshot;
  }

  if (template.layout === "MATRIX_CAVITY") {
    IDS_ROWS.forEach((row, rowIndex) => {
      for (const cavity of Array.from({ length: IDS_CAVITY_COUNT }, (_, i) => i + 1)) {
        const fallback = row.inputType === "NUMBER" ? row.dimension : "OK";
        snapshot[`ids:${rowIndex}:${cavity}`] = isNg(doc, index) ? "NG" : fallback;
      }
      index += 1;
    });
    return snapshot;
  }

  template.sections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      const key = `flat:${sectionIndex}:${itemIndex}`;
      snapshot[key] = isNg(doc, index)
        ? "NG"
        : item.inputType === "JUDGEMENT"
          ? "OK"
          : (item.exampleValue ?? item.standardText ?? "OK");
      snapshot[`remark:${key}`] = "—";
      index += 1;
    });
  });

  return snapshot;
}
