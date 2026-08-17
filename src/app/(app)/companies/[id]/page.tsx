import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { db } from "@/db";
import { deleteCompany } from "../actions";
import { EditCompanyDialog } from "./edit-company-dialog";

export default async function CompanyDetailPage({
  params,
}: PageProps<"/companies/[id]">) {
  const { id } = await params;

  const company = await db.query.companies.findFirst({
    where: (companies, { eq }) => eq(companies.id, id),
    with: { contacts: true, deals: true },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          {company.domain && (
            <p className="text-sm text-muted-foreground">{company.domain}</p>
          )}
        </div>
        <div className="flex gap-2">
          <EditCompanyDialog company={company} />
          <DeleteButton
            action={deleteCompany.bind(null, company.id)}
            confirmMessage={`Delete ${company.name}? This can't be undone.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contacts ({company.contacts.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {company.contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No contacts yet.
              </p>
            )}
            {company.contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="text-sm hover:underline"
              >
                {contact.firstName} {contact.lastName ?? ""}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals ({company.deals.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {company.deals.length === 0 && (
              <p className="text-sm text-muted-foreground">No deals yet.</p>
            )}
            {company.deals.map((deal) => (
              <Link
                key={deal.id}
                href="/deals"
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span>{deal.name}</span>
                <Badge variant="outline" className="capitalize">
                  {deal.stage.replace("_", " ")}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        {company.notes && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{company.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
