import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/delete-button";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { deleteContact } from "../actions";
import { EditContactDialog } from "./edit-contact-dialog";
import { NoteForm } from "./note-form";

export default async function ContactDetailPage({
  params,
}: PageProps<"/contacts/[id]">) {
  const { id } = await params;

  const [contact, allCompanies] = await Promise.all([
    db.query.contacts.findFirst({
      where: (contacts, { eq }) => eq(contacts.id, id),
      with: {
        company: true,
        deals: true,
        activities: true,
      },
    }),
    db.select().from(companies).orderBy(companies.name),
  ]);

  if (!contact) {
    notFound();
  }

  const activities = [...contact.activities].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {contact.firstName} {contact.lastName ?? ""}
          </h1>
          {contact.company && (
            <Link
              href={`/companies/${contact.company.id}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {contact.company.name}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <EditContactDialog contact={contact} companies={allCompanies} />
          <DeleteButton
            action={deleteContact.bind(null, contact.id)}
            confirmMessage={`Delete ${contact.firstName}? This can't be undone.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <NoteForm contactId={contact.id} />
              <Separator />
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              )}
              <ul className="flex flex-col gap-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="text-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{activity.body}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                {contact.email ?? "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Phone: </span>
                {contact.phone ?? "—"}
              </div>
              {contact.notes && (
                <div>
                  <span className="text-muted-foreground">Notes: </span>
                  <p className="whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deals ({contact.deals.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {contact.deals.length === 0 && (
                <p className="text-sm text-muted-foreground">No deals yet.</p>
              )}
              {contact.deals.map((deal) => (
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
        </div>
      </div>
    </div>
  );
}
