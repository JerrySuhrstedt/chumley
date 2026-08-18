import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentOrg } from "@/lib/org";
import { CsvImporter } from "./csv-importer";

export default async function ImportPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Import leads
          </h1>
          <p className="text-sm text-slate-500">
            Bring in a list from a spreadsheet or another CRM.
          </p>
        </div>

        <CsvImporter />
      </div>
    </div>
  );
}
