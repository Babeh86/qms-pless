import { machines } from "@/lib/mock/data";
import { MachinesClient } from "./machines-client";

export default function MachinesPage() {
  return <MachinesClient machines={machines} />;
}
