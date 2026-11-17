"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck,
  CalendarDays, CheckCircle2, ChevronDown, ClipboardCheck, ClipboardPlus, Clock3,
  FileBarChart2, FileCheck2, FilePlus2, PackageSearch, QrCode, Search, ShieldAlert,
} from "lucide-react";
import type { Checksheet } from "@/lib/mock/types";
import { Badge, judgmentTone, statusTone } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  checksheets: Checksheet[];
  counts: { partners: number; materials: number; parts: number; machines: number };
}

const trend = [
  { day: "01", total: 590, ok: 578 }, { day: "02", total: 660, ok: 648 },
  { day: "03", total: 620, ok: 610 }, { day: "04", total: 760, ok: 744 },
  { day: "05", total: 710, ok: 697 }, { day: "06", total: 850, ok: 833 },
  { day: "07", total: 790, ok: 775 }, { day: "08", total: 920, ok: 902 },
  { day: "09", total: 840, ok: 826 }, { day: "10", total: 960, ok: 941 },
  { day: "11", total: 890, ok: 875 }, { day: "12", total: 1020, ok: 999 },
];
const defects = [
  { nameKey: "defects.dimension", value: 38, color: "bg-blue-600" },
  { nameKey: "defects.appearance", value: 27, color: "bg-sky-500" },
  { nameKey: "defects.surface", value: 18, color: "bg-cyan-500" },
  { nameKey: "defects.damage", value: 12, color: "bg-orange-400" },
  { nameKey: "defects.others", value: 5, color: "bg-slate-300" },
];
const suppliers = [
  { name: "PT. PASI", code: "SUP-001", lots: 128, ok: 126, ng: 2, rate: 98.4 },
  { name: "PT. TRSI", code: "SUP-003", lots: 96, ok: 94, ng: 2, rate: 97.9 },
  { name: "PT. KMPI", code: "SUP-004", lots: 82, ok: 81, ng: 1, rate: 98.8 },
  { name: "PT. YHT", code: "SUP-005", lots: 64, ok: 63, ng: 1, rate: 98.4 },
];
const shortcuts = [
  { labelKey: "quickNew", subKey: "quickNewSub", icon: ClipboardPlus, href: "/inspection" },
  { labelKey: "quickTemplate", subKey: "quickTemplateSub", icon: FileCheck2, href: "/template" },
  { labelKey: "quickScan", subKey: "quickScanSub", icon: QrCode, href: "/inspection" },
  { labelKey: "quickSearch", subKey: "quickSearchSub", icon: PackageSearch, href: "/inspection" },
  { labelKey: "quickReport", subKey: "quickReportSub", icon: FileBarChart2, href: "/reports" },
  { labelKey: "quickNcr", subKey: "quickNcrSub", icon: ShieldAlert, href: "/inspection" },
  { labelKey: "quickCapa", subKey: "quickCapaSub", icon: BadgeCheck, href: "/reports" },
];

function PanelTitle({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-[13px] font-bold tracking-tight text-slate-800">{title}</h2>{detail ? <p className="mt-0.5 text-[10px] text-slate-400">{detail}</p> : null}</div>{action}</div>;
}

function ClickableCard({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label="Open dashboard details"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
        router.push(href);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      className={`cursor-pointer transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-500 ${className}`}
    >
      {children}
    </Card>
  );
}

function Donut({ segments, center, label }: { segments: { value: number; color: string }[]; center: string; label: string }) {
  const gradient = segments.reduce<{ stops: string[]; cursor: number }>(
    (result, segment) => {
      const end = result.cursor + segment.value;
      result.stops.push(`${segment.color} ${result.cursor}% ${end}%`);
      return { stops: result.stops, cursor: end };
    },
    { stops: [], cursor: 0 },
  ).stops.join(", ");
  return <div className="relative grid h-[132px] w-[132px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
    <div className="grid h-[94px] w-[94px] place-content-center rounded-full bg-white text-center"><strong className="text-xl font-extrabold tracking-tight text-slate-800">{center}</strong><span className="mt-0.5 text-[9px] text-slate-400">{label}</span></div>
  </div>;
}

function TrendChart() {
  const max = Math.max(...trend.map((item) => item.total));
  const points = trend.map((item, index) => `${(index / (trend.length - 1)) * 100},${88 - (item.ok / max) * 72}`).join(" ");
  return <div className="relative h-[190px] w-full pt-1">
    <div className="absolute inset-0 flex flex-col justify-between pb-6 pt-2">{["1,000", "750", "500", "250", "0"].map((n) => <div key={n} className="flex items-center gap-2"><span className="w-7 text-right text-[9px] text-slate-400">{n}</span><span className="h-px flex-1 border-t border-dashed border-slate-100" /></div>)}</div>
    <div className="absolute inset-y-2 right-0 left-10 flex items-end justify-around gap-1 pb-6">
      {trend.map((item) => <div key={item.day} className="flex h-full flex-1 items-end justify-center gap-0.5" title={`${item.total} inspected`}><span className="w-[42%] rounded-t-[3px] bg-blue-200" style={{ height: `${(item.total / max) * 86}%` }} /><span className="w-[42%] rounded-t-[3px] bg-blue-600" style={{ height: `${(item.ok / max) * 86}%` }} /></div>)}
    </div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-10 top-2 h-[calc(100%-32px)] w-[calc(100%-40px)] overflow-visible"><polyline points={points} fill="none" stroke="#f59e0b" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />{trend.map((item, index) => <circle key={item.day} cx={(index / (trend.length - 1)) * 100} cy={88 - (item.ok / max) * 72} r="1.4" fill="white" stroke="#f59e0b" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />)}</svg>
    <div className="absolute right-0 bottom-0 left-10 flex justify-around">{trend.map((item) => <span key={item.day} className="text-[9px] text-slate-400">{item.day}</span>)}</div>
  </div>;
}

export function DashboardClient({ checksheets }: Props) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [period, setPeriod] = useState("Last 30 days");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => checksheets.filter((cs) => `${cs.number} ${cs.partNo} ${cs.partName} ${cs.inspectorName}`.toLowerCase().includes(query.toLowerCase())), [checksheets, query]);
  const recent = [...filtered].sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate)).slice(0, 5);
  const routeByForm: Record<string, string> = { "CS-01": "/inspection/cs-01", "CS-02": "/inspection/cs-02", "CS-03": "/inspection/cs-03", "CS-04": "/inspection/cs-04", "CS-05": "/inspection/cs-05", "CS-06": "/inspection/cs-06" };
  const kpis = [
    { label: t("stats.total"), value: "5,840", change: "+12.8%", icon: ClipboardCheck, tone: "blue", hint: t("comparison"), href: "/inspection" },
    { label: t("passRate"), value: "98.2%", change: "+0.6%", icon: CheckCircle2, tone: "green", hint: t("comparison"), href: "/reports" },
    { label: "NG (Not Good)", value: "105", change: "−8.4%", icon: AlertTriangle, tone: "red", hint: t("comparison"), href: "/reports?view=ng#ng-register" },
    { label: t("stats.pending"), value: "12", change: `3 ${t("urgent")}`, icon: Clock3, tone: "orange", hint: t("awaitingReview"), href: "/approval" },
    { label: "Open NCR / CAPA", value: "4", change: `2 ${t("overdue")}`, icon: ShieldAlert, tone: "violet", hint: t("openActions"), href: "/reports?view=ng#ng-register" },
  ];
  const toneClass: Record<string, string> = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", red: "bg-rose-50 text-rose-600", orange: "bg-orange-50 text-orange-600", violet: "bg-violet-50 text-violet-600" };

  return <div className="space-y-5 pb-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="mb-1 flex items-center gap-2"><span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-bold tracking-[0.14em] text-blue-700 uppercase">{t("plantKarawang")}</span><span className="text-[10px] text-slate-400">• {t("updatedNow")}</span></div><h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">{t("mantarisTitle")}</h1><p className="mt-1 text-[12px] text-slate-500">{t("dashboardSubtitle")}</p></div>
      <div className="flex items-center gap-2"><label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-600"><CalendarDays className="h-3.5 w-3.5 text-slate-400"/><select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-transparent outline-none"><option value="Last 30 days">{t("period30")}</option><option value="This month">{t("periodMonth")}</option><option value="This quarter">{t("periodQuarter")}</option></select><ChevronDown className="h-3 w-3"/></label><Link href="/inspection" className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 px-3.5 text-[11px] font-semibold text-white shadow-md shadow-blue-900/10 transition hover:from-blue-800 hover:to-blue-700"><FilePlus2 className="h-3.5 w-3.5"/>{t("newInspectionAction")}</Link></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((item) => { const Icon = item.icon; return <ClickableCard key={item.label} href={item.href} className="overflow-hidden border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)]"><CardContent className="relative p-4"><span className={`absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-xl ${toneClass[item.tone]}`}><Icon className="h-[17px] w-[17px]"/></span><p className="pr-10 text-[10px] font-semibold text-slate-500">{item.label}</p><p className="mt-2 text-[25px] leading-none font-extrabold tracking-tight text-slate-900">{item.value}</p><div className="mt-3 flex items-center gap-1.5 text-[9px]"><span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bold ${item.tone === "red" ? "bg-emerald-50 text-emerald-700" : item.tone === "orange" || item.tone === "violet" ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>{item.tone === "red" ? <ArrowDownRight className="h-3 w-3"/> : <ArrowUpRight className="h-3 w-3"/>}{item.change}</span><span className="text-slate-400">{item.hint}</span></div></CardContent></ClickableCard>; })}
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <ClickableCard href="/reports" className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-7"><CardContent className="p-4 sm:p-5"><PanelTitle title={t("trendTitle")} detail={t("trendDetail")} action={<div className="flex flex-wrap gap-3 text-[9px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-blue-200"/>{t("trendTotal")}</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-blue-600"/>{t("trendOk")}</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-orange-400"/>{t("passRate")}</span></div>}/><TrendChart/></CardContent></ClickableCard>
      <ClickableCard href="/reports" className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-5"><CardContent className="p-4 sm:p-5"><PanelTitle title={t("resultTitle")} detail={t("resultDetail")}/><div className="flex items-center justify-center gap-6 py-2 sm:gap-8"><Donut segments={[{value:98.2,color:"#16a36a"},{value:1.8,color:"#ef5454"}]} center="98.2%" label={t("passRate")}/><div className="space-y-4"><div><p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500"><i className="h-2 w-2 rounded-full bg-emerald-500"/>{t("ok")}</p><p className="mt-1 text-lg font-extrabold text-slate-800">5,735 <span className="text-[10px] font-medium text-slate-400">(98.2%)</span></p></div><div><p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500"><i className="h-2 w-2 rounded-full bg-rose-500"/>{t("ng")}</p><p className="mt-1 text-lg font-extrabold text-slate-800">105 <span className="text-[10px] font-medium text-slate-400">(1.8%)</span></p></div></div></div></CardContent></ClickableCard>
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <ClickableCard href="/reports?view=ng#ng-register" className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-4"><CardContent className="p-4"><PanelTitle title={t("defectTitle")} detail={t("defectDetail")}/><div className="space-y-3">{defects.map((d) => <div key={d.nameKey}><div className="mb-1 flex justify-between gap-2 text-[9px]"><span className="truncate text-slate-600">{t(d.nameKey)}</span><strong className="text-slate-700">{d.value}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${d.color}`} style={{width:`${d.value/38*100}%`}}/></div></div>)}</div></CardContent></ClickableCard>
      <ClickableCard href="/inspection" className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-4"><CardContent className="p-4"><PanelTitle title={t("typeTitle")} detail={t("typeDetail")}/><div className="space-y-4 pt-1">{[{name:t("inspectionTypes.incoming"),rate:99.1,count:"2,140 lots",color:"bg-blue-600"},{name:t("inspectionTypes.patrol"),rate:97.8,count:"2,890 checks",color:"bg-sky-500"},{name:t("inspectionTypes.final"),rate:98.4,count:"810 checks",color:"bg-cyan-500"}].map((x) => <div key={x.name}><div className="mb-1.5 flex justify-between text-[10px]"><span className="font-medium text-slate-700">{x.name}</span><span className="font-bold text-slate-800">{x.rate}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${x.color}`} style={{width:`${x.rate}%`}}/></div><p className="mt-1 text-[9px] text-slate-400">{x.count}</p></div>)}</div></CardContent></ClickableCard>
      <ClickableCard href="/approval" className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-4"><CardContent className="p-4"><PanelTitle title={t("statusTitle")} detail={t("statusDetail")}/><div className="flex items-center justify-center gap-4"><Donut segments={[{value:66,color:"#2563eb"},{value:19,color:"#38bdf8"},{value:11,color:"#f59e0b"},{value:4,color:"#cbd5e1"}]} center="1,284" label={t("docCount")}/><div className="space-y-2.5">{[{label:t("completed"),value:"846",color:"bg-blue-600"},{label:t("inProgress"),value:"244",color:"bg-sky-400"},{label:t("stats.pending"),value:"142",color:"bg-orange-400"},{label:t("onHold"),value:"52",color:"bg-slate-300"}].map((x)=><p key={x.label} className="flex min-w-[112px] items-center gap-2 text-[9px] text-slate-500"><i className={`h-2 w-2 rounded-full ${x.color}`}/>{x.label}<strong className="ml-auto text-slate-700">{x.value}</strong></p>)}</div></div></CardContent></ClickableCard>
    </div>

    <div className="grid gap-4 xl:grid-cols-12">
      <Card className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-7"><CardContent className="p-4"><PanelTitle title={t("supplierPerformance")} detail={t("topSuppliers")} action={<Link href="/master/partners" className="text-[10px] font-semibold text-blue-700 hover:text-blue-900">{t("viewAll")} <ArrowRight className="inline h-3 w-3"/></Link>}/><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-semibold tracking-wide text-slate-400 uppercase"><th className="pb-2">{t("supplier")}</th><th className="pb-2 text-right">{t("lots")}</th><th className="pb-2 text-right">{t("ok")}</th><th className="pb-2 text-right">{t("ng")}</th><th className="pb-2 pl-4">{t("passRateShort")}</th></tr></thead><tbody>{suppliers.map((s)=><tr key={s.code} tabIndex={0} role="link" aria-label={s.name} onClick={(event)=>{if((event.target as HTMLElement).closest("a,button"))return;router.push("/master/partners");}} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();router.push("/master/partners");}}} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-blue-500"><td className="py-2.5"><span className="block text-[10px] font-semibold text-slate-700">{s.name}</span><span className="text-[9px] text-slate-400">{s.code}</span></td><td className="py-2.5 text-right text-[10px] text-slate-600">{s.lots}</td><td className="py-2.5 text-right text-[10px] font-medium text-emerald-700">{s.ok}</td><td className="py-2.5 text-right text-[10px] font-medium text-rose-600">{s.ng}</td><td className="py-2.5 pl-4"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${s.rate}%`}}/></div><span className="text-[9px] font-bold text-slate-700">{s.rate}%</span></div></td></tr>)}</tbody></table></div></CardContent></Card>
      <Card className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)] xl:col-span-5"><CardContent className="p-4"><PanelTitle title={t("quickTitle")} detail={t("quickDetail")}/><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">{shortcuts.map((item)=>{const Icon=item.icon;return <Link href={item.href} key={item.labelKey} className="group flex min-h-[67px] items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/70"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-slate-100 group-hover:bg-blue-600 group-hover:text-white"><Icon className="h-4 w-4"/></span><span className="min-w-0"><strong className="block truncate text-[9px] font-semibold text-slate-700">{t(item.labelKey)}</strong><small className="mt-0.5 block truncate text-[8px] text-slate-400">{t(item.subKey)}</small></span></Link>;})}</div></CardContent></Card>
    </div>

    <Card className="border-slate-200/80 shadow-[0_2px_10px_rgba(15,39,77,0.04)]"><CardContent className="p-4"><PanelTitle title={t("recentActivity")} detail={t("recentDetail")} action={<label className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-2.5"><Search className="h-3 w-3 text-slate-400"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={t("searchActivity")} className="w-32 bg-transparent text-[9px] outline-none placeholder:text-slate-400"/></label>}/><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-semibold tracking-wide text-slate-400 uppercase"><th className="pb-2">{t("activityTime")}</th><th className="pb-2">{t("activityPart")}</th><th className="pb-2">{t("inspectionType")}</th><th className="pb-2 text-center">{t("result")}</th><th className="pb-2">{t("inspector")}</th><th className="pb-2">{t("status")}</th></tr></thead><tbody>{recent.map((cs)=>{const href=`${routeByForm[cs.formCode] ?? "/inspection"}/${cs.id}`;return <tr key={cs.id} tabIndex={0} role="link" aria-label={cs.number} onClick={(event)=>{if((event.target as HTMLElement).closest("a,button,input"))return;router.push(href);}} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();router.push(href);}}} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/60 focus-visible:outline-2 focus-visible:outline-blue-500"><td className="py-2.5"><Link href={href} className="block text-[10px] font-semibold text-blue-700 hover:underline">{cs.number}</Link><span className="text-[9px] text-slate-400">{cs.inspectionDate}</span></td><td className="py-2.5"><span className="block text-[10px] font-semibold text-slate-700">{cs.partNo}</span><span className="text-[9px] text-slate-400">{cs.partName}</span></td><td className="py-2.5 text-[10px] text-slate-600">{cs.formName}</td><td className="py-2.5 text-center"><Badge tone={judgmentTone(cs.finalJudgment)}>{cs.finalJudgment ?? "—"}</Badge></td><td className="py-2.5 text-[10px] text-slate-600">{cs.inspectorName}</td><td className="py-2.5"><Badge tone={statusTone(cs.status)} dot>{cs.status}</Badge></td></tr>;})}</tbody></table>{recent.length===0?<p className="py-8 text-center text-[11px] text-slate-400">{t("emptySearch")}</p>:null}</div></CardContent></Card>
  </div>;
}
