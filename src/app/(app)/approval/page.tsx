import { checksheets } from "@/lib/mock/data";
import { ApprovalClient } from "./approval-client";

export default function ApprovalPage() {
  return <ApprovalClient checksheets={checksheets} />;
}
