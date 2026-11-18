import Link from "next/link";
import { CloudOff } from "lucide-react";

/**
 * Offline fallback. Static and cache-friendly so the service worker can serve it
 * when a navigation cannot reach the network.
 */
export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f4f8fd_0%,#f8fafc_48%,#eef5fc_100%)] px-4">
      <div className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-500">
          <CloudOff className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-base font-bold text-ink-900">Anda sedang offline</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          Halaman ini belum tersimpan di perangkat. Draft yang sudah disimpan akan
          tersinkronisasi otomatis saat koneksi kembali.
        </p>
        <Link
          href="/inspection"
          className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Coba halaman inspeksi
        </Link>
      </div>
    </main>
  );
}
