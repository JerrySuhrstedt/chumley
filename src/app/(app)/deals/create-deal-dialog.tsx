"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Company, Contact } from "@/db/schema";
import { createDeal } from "./actions";
import { DealForm } from "./deal-form";

export function CreateDealDialog({
  contacts,
  companies,
}: {
  contacts: Contact[];
  companies: Company[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
        </DialogHeader>
        <DealForm
          action={createDeal}
          contacts={contacts}
          companies={companies}
          submitLabel="Create deal"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
