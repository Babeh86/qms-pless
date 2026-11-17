import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/auth/session";

/** Halaman akar: arahkan ke dashboard bila sudah login, selain itu ke login. */
export default async function RootPage() {
  const session = await getSessionContext();
  redirect(session ? "/dashboard" : "/login");
}
