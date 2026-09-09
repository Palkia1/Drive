"use client";

import { Download } from "lucide-react";

/** "Downloaden als PDF" without a PDF-rendering dependency — the report
 * page's own print stylesheet (see rapport/page.tsx) makes the browser's
 * native print-to-PDF produce a clean result; this button is just a
 * friendlier trigger for it than telling instructors to hit Ctrl+P. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary print:hidden flex items-center gap-1.5">
      <Download size={16} /> Downloaden als PDF
    </button>
  );
}
