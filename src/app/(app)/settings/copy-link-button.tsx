"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopiedChip } from "@/components/copied-chip";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    // Relative, because the chip is positioned against this button.
    <span className="relative inline-flex">
      <CopiedChip show={copied} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        Copy link
      </Button>
    </span>
  );
}
