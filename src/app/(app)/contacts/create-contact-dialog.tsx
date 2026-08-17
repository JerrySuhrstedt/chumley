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
import type { Company } from "@/db/schema";
import { createContact } from "./actions";
import { ContactForm } from "./contact-form";

export function CreateContactDialog({ companies }: { companies: Company[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
        </DialogHeader>
        <ContactForm
          action={createContact}
          companies={companies}
          submitLabel="Create contact"
        />
      </DialogContent>
    </Dialog>
  );
}
