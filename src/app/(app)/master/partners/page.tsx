import { businessPartners } from "@/lib/mock/data";
import { PartnersClient } from "./partners-client";

export default function PartnersPage() {
  return <PartnersClient partners={businessPartners} />;
}
