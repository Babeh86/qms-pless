import { materials } from "@/lib/mock/data";
import { MaterialsClient } from "./materials-client";

export default function MaterialsPage() {
  return <MaterialsClient materials={materials} />;
}
