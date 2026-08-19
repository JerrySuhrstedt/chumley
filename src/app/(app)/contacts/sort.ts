import type { Activity, Lead } from "@/db/schema";

export type SortKey =
  | "last"
  | "first"
  | "company"
  | "newest"
  | "recent"
  | "cold"
  | "changed";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "last", label: "Last name (A-Z)" },
  { key: "first", label: "First name (A-Z)" },
  { key: "company", label: "Company (A-Z)" },
  { key: "newest", label: "Newest first" },
  { key: "recent", label: "Talked to most recently" },
  { key: "cold", label: "Not talked to longest" },
  { key: "changed", label: "Changed most recently" },
];

export function isSortKey(value: unknown): value is SortKey {
  return SORTS.some((s) => s.key === value);
}

type Row = Lead & { activities: Activity[] };

/** Whatever is after the final space. Good enough for a contact list. */
function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toLowerCase();
}

/** Most recent real touch, ignoring the ones the system writes itself. */
export function lastTouched(row: Row): number | null {
  const times = row.activities
    .filter((a) => a.type !== "stage_change")
    .map((a) => new Date(a.createdAt).getTime());
  return times.length ? Math.max(...times) : null;
}

const text = (value: string | null) => (value ?? "").trim().toLowerCase();

export function sortContacts(rows: Row[], key: SortKey): Row[] {
  const sorted = [...rows];

  switch (key) {
    case "first":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "company":
      // Nobody wants a screen of blanks at the top, so unknown goes last.
      return sorted.sort((a, b) => {
        const x = text(a.companyName);
        const y = text(b.companyName);
        if (!x && !y) return a.name.localeCompare(b.name);
        if (!x) return 1;
        if (!y) return -1;
        return x.localeCompare(y) || a.name.localeCompare(b.name);
      });

    case "changed":
      // Any edit, stage move, or logged activity bumps updatedAt.
      return sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case "recent":
      return sorted.sort((a, b) => {
        const x = lastTouched(a);
        const y = lastTouched(b);
        if (x === null && y === null) return a.name.localeCompare(b.name);
        if (x === null) return 1;
        if (y === null) return -1;
        return y - x;
      });

    case "cold":
      // Never touched is the coldest thing there is, so it leads.
      return sorted.sort((a, b) => {
        const x = lastTouched(a);
        const y = lastTouched(b);
        if (x === null && y === null) return a.name.localeCompare(b.name);
        if (x === null) return -1;
        if (y === null) return 1;
        return x - y;
      });

    case "last":
    default:
      return sorted.sort(
        (a, b) =>
          lastName(a.name).localeCompare(lastName(b.name)) ||
          a.name.localeCompare(b.name)
      );
  }
}
