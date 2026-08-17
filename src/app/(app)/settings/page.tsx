import Link from "next/link";
import { ChevronRight, MessageSquareText, Users } from "lucide-react";
import { getCurrentOrg } from "@/lib/org";

const SECTIONS = [
  {
    href: "/settings/team",
    label: "Team",
    description: "Invite teammates, manage members, and your lead webhook.",
    icon: Users,
  },
  {
    href: "/settings/templates",
    label: "Templates",
    description: "Saved text and email follow-ups you can send in two taps.",
    icon: MessageSquareText,
  },
];

export default async function SettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mb-4 text-sm text-slate-500">{current.org.name}</p>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <section.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">
                      {section.label}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {section.description}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
