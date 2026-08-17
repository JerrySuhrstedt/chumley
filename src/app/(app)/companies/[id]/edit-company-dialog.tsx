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
import type { Company } from "@/db/schema";
import { updateCompany } from "../actions";
import { CompanyForm } from "../company-form";

export function EditCompanyDialog({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);
  const action = updateCompany.bind(null, company.id);

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
          <DialogTitle>Edit company</DialogTitle>
        </DialogHeader>
        <CompanyForm
          action={action}
          company={company}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
