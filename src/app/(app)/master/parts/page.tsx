import { parts } from "@/lib/mock/data";
import { PartsClient } from "./parts-client";

export default function PartsPage() {
  return <PartsClient parts={parts} />;
}
