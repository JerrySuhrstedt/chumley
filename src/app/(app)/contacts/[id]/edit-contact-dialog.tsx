"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Company, Contact } from "@/db/schema";
import { updateContact } from "../actions";
import { ContactForm } from "../contact-form";

export function EditContactDialog({
  contact,
  companies,
}: {
  contact: Contact;
  companies: Company[];
}) {
  const [open, setOpen] = useState(false);
  const action = updateContact.bind(null, contact.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
        </DialogHeader>
        <ContactForm
          action={action}
          contact={contact}
          companies={companies}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
