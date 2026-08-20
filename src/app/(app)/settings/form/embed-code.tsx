"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopiedChip } from "@/components/copied-chip";

/**
 * The one thing the customer's web person needs. Kept to a single line so
 * it can be pasted without understanding it.
 */
export function EmbedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
      <span className="relative inline-flex self-start">
        <CopiedChip show={copied} />
        <Button onClick={copy} variant="outline">
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          Copy the code
        </Button>
      </span>
    </div>
  );
}
