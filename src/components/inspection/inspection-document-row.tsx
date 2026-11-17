"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, MouseEvent, KeyboardEvent } from "react";

export function InspectionDocumentRow({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function navigate(event: MouseEvent<HTMLTableRowElement>) {
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    router.push(href);
  }

  function navigateByKeyboard(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

  return (
    <tr
      tabIndex={0}
      role="link"
      aria-label="Open inspection document"
      onClick={navigate}
      onKeyDown={navigateByKeyboard}
      className="cursor-pointer transition-colors hover:bg-ink-50/70 focus-visible:bg-ink-50 focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      {children}
    </tr>
  );
}
