"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTemplate } from "./actions";

export function DeleteTemplateButton({ id }: { id: string }) {
  return (
    <form
      action={() => deleteTemplate(id)}
      onSubmit={(e) => {
        if (!confirm("Delete this template?")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="icon">
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
