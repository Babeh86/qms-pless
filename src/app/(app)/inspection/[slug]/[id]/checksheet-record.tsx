import { Card, CardContent } from "@/components/ui/card";
import { Badge, judgmentTone } from "@/components/ui/badge";
import type { Checksheet } from "@/lib/mock/types";
import type { ChecksheetTemplate } from "@/lib/mock/templates-flat";
import { IDS_CAVITY_COUNT, IDS_ROWS, PATROL_CHARA, PATROL_SLOTS } from "@/lib/mock/templates-matrix";
import { partnerByCode, materialById, parts } from "@/lib/mock/data";

function isNg(doc: Checksheet, index: number) {
  return doc.finalJudgment === "NG" && index < doc.ngItems;
}

function savedValue(doc: Checksheet, key: string, index: number, fallback: string) {
  if (doc.itemSnapshot?.[key] !== undefined) return doc.itemSnapshot[key];
  if (isNg(doc, index)) return "NG";
  return fallback;
}

function flatValue(doc: Checksheet, item: ChecksheetTemplate["sections"][number]["items"][number], key: string, index: number) {
  const fallback = item.inputType === "JUDGEMENT" ? "OK" : item.exampleValue ?? item.standardText ?? "OK";
  return savedValue(doc, key, index, fallback);
}

export function ChecksheetRecord({
  doc,
  template,
}: {
  doc: Checksheet;
  template: ChecksheetTemplate;
}) {
  if (template.layout === "MATRIX_TIME") {
    return <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-[10px]"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="sticky left-0 z-10 bg-slate-50 px-3 py-2">Time</th>{PATROL_CHARA.map((chara) => <th key={chara.no} title={chara.text} className="min-w-10 border-l border-slate-200 px-1 py-2 text-center">{chara.no}</th>)}<th className="border-l border-slate-200 px-3 py-2">Remark</th></tr></thead><tbody>{PATROL_SLOTS.map((slot, rowIndex) => <tr key={slot} className="border-t border-slate-100"><th className="sticky left-0 bg-white px-3 py-2 font-mono font-semibold">{slot}</th>{PATROL_CHARA.map((chara, colIndex) => { const key = `patrol:${slot}:${chara.no}`; const cell = savedValue(doc, key, rowIndex * PATROL_CHARA.length + colIndex, "OK"); return <td key={chara.no} className="border-l border-slate-100 px-1 py-1 text-center"><span className={`inline-flex min-w-7 justify-center rounded px-1.5 py-1 text-[9px] font-bold ${cell === "NG" ? "bg-rose-100 text-rose-700" : cell === "NA" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{cell}</span></td>; })}<td className="border-l border-slate-100 px-3 py-2 text-slate-500">{doc.itemSnapshot?.[`remark:${slot}`] ?? "—"}</td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[9px] text-slate-500"><span>Inspection points: {PATROL_CHARA.length}</span><span>Time slots: {PATROL_SLOTS.length}</span><span className="ml-auto">{doc.ngItems} NG finding(s)</span></div></CardContent></Card>;
  }

  if (template.layout === "MATRIX_CAVITY") {
    let itemIndex = 0;
    return <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-[10px]"><thead><tr className="border-b-2 border-slate-300 bg-slate-50"><th className="sticky left-0 z-10 bg-slate-50 px-2 py-2">No.</th><th className="px-2 py-2">Item Check</th><th className="px-2 py-2">Dimension / Standard</th><th className="px-2 py-2">Tolerance</th><th className="px-2 py-2">Frequency</th><th className="px-2 py-2">Tool</th><th className="px-2 py-2">Area</th>{Array.from({ length: IDS_CAVITY_COUNT }, (_, i) => <th key={i} className="border-l border-slate-200 bg-blue-50 px-1.5 py-2 text-center">C{i + 1}</th>)}<th className="border-l border-slate-200 px-2 py-2">Judge</th></tr></thead><tbody>{IDS_ROWS.map((row, rowIndex) => { const index = itemIndex++; const values = Array.from({ length: IDS_CAVITY_COUNT }, (_, cavityIndex) => { const key = `ids:${rowIndex}:${cavityIndex + 1}`; return savedValue(doc, key, index, row.inputType === "NUMBER" ? row.dimension : "OK"); }); const hasNg = values.some((value) => value === "NG" || (row.inputType === "NUMBER" && row.rangeMin !== undefined && Number(value) > row.rangeMax!)); const judge: "OK" | "NG" | null = hasNg ? "NG" : values.some((value) => value === "") ? null : "OK"; return <tr key={`${row.no}-${row.area}-${rowIndex}`} className="border-t border-slate-100"><td className="sticky left-0 bg-white px-2 py-2 font-mono">{row.no}</td><td className="px-2 py-2 font-semibold">{row.itemCheck}</td><td className="px-2 py-2">{row.dimension}</td><td className="px-2 py-2">{row.range ?? "—"}</td><td className="px-2 py-2">{row.freq}</td><td className="px-2 py-2">{row.tool}</td><td className="px-2 py-2">{row.area}</td>{values.map((value, cavityIndex) => { const outside = row.inputType === "NUMBER" && row.rangeMin !== undefined && (Number(value) < row.rangeMin || Number(value) > row.rangeMax!); const ng = value === "NG" || outside; return <td key={cavityIndex} className="border-l border-slate-100 px-1 py-1 text-center"><span className={`inline-flex min-w-10 justify-center rounded px-1 py-1 font-mono ${ng ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{value}</span></td>; })}<td className="border-l border-slate-100 px-2 py-1 text-center"><Badge tone={judgmentTone(judge)}>{judge ?? "—"}</Badge></td></tr>; })}</tbody></table></div></CardContent></Card>;
  }

  let flatIndex = 0;
  return <div className="space-y-3">{template.sections.map((section, sectionIndex) => <Card key={`${section.title}-${sectionIndex}`} className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5"><h2 className="text-xs font-bold text-slate-800">{section.title}</h2><span className="text-[9px] text-slate-400">{section.items.length} item(s)</span></div><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-[9px] font-semibold tracking-wide text-slate-400 uppercase"><th className="px-3 py-2">No.</th><th className="px-3 py-2">Inspection Item</th><th className="px-3 py-2">Standard / Tolerance</th><th className="px-3 py-2">Actual Result</th><th className="px-3 py-2 text-center">Judge</th><th className="px-3 py-2">Remark</th></tr></thead><tbody>{section.items.map((item, itemIndexInSection) => { const index = flatIndex++; const key = `flat:${sectionIndex}:${itemIndexInSection}`; const value = flatValue(doc, item, key, index); const judgment = value === "NG" || (item.inputType === "NUMBER" && item.rangeMin !== undefined && (Number(value) < item.rangeMin || Number(value) > item.rangeMax!)) ? "NG" : "OK"; return <tr key={key} className="border-t border-slate-100"><td className="px-3 py-2 font-mono text-[10px] text-slate-500">{item.no ?? index + 1}</td><td className="px-3 py-2"><p className="font-semibold text-slate-800">{item.detailCheck}</p>{item.tool ? <p className="mt-0.5 text-[9px] text-slate-400">{item.tool}</p> : null}</td><td className="px-3 py-2 text-slate-600">{item.standardText ?? item.standardValue ?? "—"}{item.rangeMin !== undefined ? <span className="block text-[9px] text-slate-400">{item.rangeMin} – {item.rangeMax}</span> : null}</td><td className="px-3 py-2 font-medium text-slate-700">{value}</td><td className="px-3 py-2 text-center"><Badge tone={judgmentTone(judgment)}>{judgment}</Badge></td><td className="px-3 py-2 text-slate-500">{doc.itemSnapshot?.[`remark:${key}`] ?? "—"}</td></tr>; })}</tbody></table></div></CardContent></Card>)}</div>;
}

export function checksheetHeaderSnapshot(doc: Checksheet) {
  const part = parts.find((entry) => entry.partNo === doc.partNo);
  const material = part ? materialById(part.materialId) : undefined;
  const defaults: Record<string, string> = {
    partNo: doc.partNo,
    partName: doc.partName,
    supplier: partnerByCode(doc.supplierCode)?.name ?? doc.supplierCode ?? "",
    customer: doc.customerName ?? "",
    material: material ? [material.name, material.additiveMasterbatch, material.color].filter(Boolean).join(" ") : "",
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
    prosesInsp: "INJECTION PROCESS",
  };
  return { ...defaults, ...(doc.headerSnapshot ?? {}) };
}

export function checksheetItemSnapshot(doc: Checksheet, template: ChecksheetTemplate) {
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
  } else if (template.layout === "MATRIX_CAVITY") {
    IDS_ROWS.forEach((row, rowIndex) => {
      for (let cavity = 1; cavity <= IDS_CAVITY_COUNT; cavity += 1) {
        const fallback = row.inputType === "NUMBER" ? row.dimension : "OK";
        snapshot[`ids:${rowIndex}:${cavity}`] = isNg(doc, index) ? "NG" : fallback;
      }
      index += 1;
    });
  } else {
    template.sections.forEach((section, sectionIndex) => {
      section.items.forEach((item, itemIndex) => {
        const key = `flat:${sectionIndex}:${itemIndex}`;
        snapshot[key] = isNg(doc, index)
          ? "NG"
          : item.inputType === "JUDGEMENT"
            ? "OK"
            : item.exampleValue ?? item.standardText ?? "OK";
        snapshot[`remark:${key}`] = "—";
        index += 1;
      });
    });
  }
  return snapshot;
}
