import { checksheets, businessPartners, materials, parts, machines } from "@/lib/mock/data";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <DashboardClient
      checksheets={checksheets}
      counts={{
        partners: businessPartners.length,
        materials: materials.length,
        parts: parts.length,
        machines: machines.length,
      }}
    />
  );
}
