import { checksheets } from "@/lib/mock/data";
import { ReportsClient } from "./reports-client";

export default function ReportsPage() {
  return <ReportsClient checksheets={checksheets} />;
}
