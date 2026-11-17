"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentActions({ printLabel }: { printLabel: string }) {
  return (
    <>
      <Button
        variant="outline"
        size="md"
        iconLeft={<Printer className="h-3.5 w-3.5" />}
        onClick={() => window.print()}
      >
        {printLabel}
      </Button>
      <Button
        variant="outline"
        size="md"
        iconLeft={<Download className="h-3.5 w-3.5" />}
        onClick={() => window.print()}
      >
        PDF
      </Button>
    </>
  );
}
