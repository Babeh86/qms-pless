import { checksheets } from "@/lib/mock/data";
import { InspectionClient } from "./inspection-client";

export default function InspectionPage() {
  return <InspectionClient checksheets={checksheets} />;
}
