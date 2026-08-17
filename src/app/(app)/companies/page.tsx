import Link from "next/link";
import { desc, ilike } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { CreateCompanyDialog } from "./create-company-dialog";

export default async function CompaniesPage({
  searchParams,
}: PageProps<"/companies">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const allCompanies = await db.query.companies.findMany({
    where: query ? ilike(companies.name, `%${query}%`) : undefined,
    orderBy: desc(companies.createdAt),
    with: { contacts: true, deals: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <CreateCompanyDialog />
      </div>

      <form className="max-w-sm">
        <Input
          name="q"
          placeholder="Search companies..."
          defaultValue={query}
        />
      </form>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Deals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allCompanies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No companies yet.
                </TableCell>
              </TableRow>
            )}
            {allCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>
                  <Link
                    href={`/companies/${company.id}`}
                    className="font-medium hover:underline"
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.domain ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.contacts.length}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.deals.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
