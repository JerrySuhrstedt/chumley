import type { Activity, Lead } from "@/db/schema";

export type SortKey =
  | "last"
  | "first"
  | "company"
  | "added"
  | "talked"
  | "changed";

export type SortDir = "asc" | "desc";

/**
 * Field and direction are separate so every sort can run both ways without
 * a dropdown of fourteen near-identical lines.
 */
export const SORTS: {
  key: SortKey;
  label: string;
  kind: "text" | "date";
}[] = [
  { key: "last", label: "Last name", kind: "text" },
  { key: "first", label: "First name", kind: "text" },
  { key: "company", label: "Company", kind: "text" },
  { key: "added", label: "Date added", kind: "date" },
  { key: "talked", label: "Last talked to", kind: "date" },
  { key: "changed", label: "Last changed", kind: "date" },
];

export function isSortKey(value: unknown): value is SortKey {
  return SORTS.some((s) => s.key === value);
}

export function sortKind(key: SortKey) {
  return SORTS.find((s) => s.key === key)?.kind ?? "text";
}

/** Names read A to Z; dates read newest first. Each field's own default. */
export function defaultDir(key: SortKey): SortDir {
  return sortKind(key) === "date" ? "desc" : "asc";
}

/** What the toggle should say, given the field it applies to. */
export function dirLabel(key: SortKey, dir: SortDir) {
  if (sortKind(key) === "date") {
    return dir === "desc" ? "Newest first" : "Oldest first";
  }
  return dir === "asc" ? "A-Z" : "Z-A";
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
const time = (value: Date | string) => new Date(value).getTime();

export function sortContacts(
  rows: Row[],
  key: SortKey,
  dir: SortDir
): Row[] {
  const flip = dir === "asc" ? 1 : -1;
  const sorted = [...rows];

  switch (key) {
    case "first":
      return sorted.sort((a, b) => flip * a.name.localeCompare(b.name));

    case "company":
      // Blanks sit at the bottom whichever way it is sorted, because a
      // screen of empty rows is never what anyone wanted.
      return sorted.sort((a, b) => {
        const x = text(a.companyName);
        const y = text(b.companyName);
        if (!x && !y) return a.name.localeCompare(b.name);
        if (!x) return 1;
        if (!y) return -1;
        return flip * x.localeCompare(y) || a.name.localeCompare(b.name);
      });

    case "added":
      return sorted.sort((a, b) => flip * (time(a.createdAt) - time(b.createdAt)));

    case "changed":
      return sorted.sort((a, b) => flip * (time(a.updatedAt) - time(b.updatedAt)));

    case "talked":
      // Never talked to is the coldest thing there is, so oldest-first puts
      // those at the very top and newest-first leaves them at the bottom.
      return sorted.sort((a, b) => {
        const x = lastTouched(a);
        const y = lastTouched(b);
        if (x === null && y === null) return a.name.localeCompare(b.name);
        if (x === null) return dir === "asc" ? -1 : 1;
        if (y === null) return dir === "asc" ? 1 : -1;
        return flip * (x - y);
      });

    case "last":
    default:
      return sorted.sort(
        (a, b) =>
          flip * lastName(a.name).localeCompare(lastName(b.name)) ||
          a.name.localeCompare(b.name)
      );
  }
}
