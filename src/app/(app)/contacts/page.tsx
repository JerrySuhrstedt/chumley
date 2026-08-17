import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
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
import { companies, contacts } from "@/db/schema";
import { CreateContactDialog } from "./create-contact-dialog";

export default async function ContactsPage({
  searchParams,
}: PageProps<"/contacts">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const [allContacts, allCompanies] = await Promise.all([
    db.query.contacts.findMany({
      where: query
        ? or(
            ilike(contacts.firstName, `%${query}%`),
            ilike(contacts.lastName, `%${query}%`),
            ilike(contacts.email, `%${query}%`)
          )
        : undefined,
      orderBy: desc(contacts.createdAt),
      with: { company: true },
    }),
    db.select().from(companies).orderBy(companies.name),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <CreateContactDialog companies={allCompanies} />
      </div>

      <form className="max-w-sm">
        <Input
          name="q"
          placeholder="Search contacts..."
          defaultValue={query}
        />
      </form>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allContacts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No contacts yet.
                </TableCell>
              </TableRow>
            )}
            {allContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="font-medium hover:underline"
                  >
                    {contact.firstName} {contact.lastName ?? ""}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.phone ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.company?.name ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
