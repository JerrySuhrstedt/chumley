"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { CheckCircle2, FileUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizePhone } from "@/lib/phone";
import { importLeads, type ImportRow } from "./actions";
import {
  autoMap,
  IMPORT_FIELDS,
  parseDate,
  parseStage,
  parseValue,
  textOrNull,
  type FieldKey,
} from "./fields";

type Step = "upload" | "map" | "done";
type Row = Record<string, string>;

const CHUNK_SIZE = 200;
const MAX_ROWS = 10_000;

/** The trigger shows the field's friendly label, not its internal key. */
function fieldLabel(value: unknown) {
  if (!value || value === "__skip") return "Skip this column";
  return (
    IMPORT_FIELDS.find((f) => f.key === value)?.label ?? "Skip this column"
  );
}

export function CsvImporter() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "">>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [intoPipeline, setIntoPipeline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skippedDuplicate: number;
    skippedNoName: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (parsed) => {
        const cols = (parsed.meta.fields ?? []).filter(Boolean);
        if (cols.length === 0) {
          setError("That file has no column headers in its first row.");
          return;
        }
        if (parsed.data.length === 0) {
          setError("That file has headers but no rows.");
          return;
        }
        if (parsed.data.length > MAX_ROWS) {
          setError(
            `That file has ${parsed.data.length.toLocaleString()} rows. Split it into files of ${MAX_ROWS.toLocaleString()} or fewer.`
          );
          return;
        }

        setFileName(file.name);
        setHeaders(cols);
        setRows(parsed.data);
        setMapping(autoMap(cols));
        setStep("map");
      },
      error: () => setError("That file couldn't be read as CSV."),
    });
  }

  /** Which CSV column feeds a given lead field, if any. */
  function columnFor(field: FieldKey): string | undefined {
    return headers.find((h) => mapping[h] === field);
  }

  function buildRow(row: Row): ImportRow | null {
    const get = (field: FieldKey) => {
      const col = columnFor(field);
      return col ? row[col] : undefined;
    };

    const full = textOrNull(get("name"));
    const first = textOrNull(get("firstName"));
    const last = textOrNull(get("lastName"));
    const name = full ?? [first, last].filter(Boolean).join(" ").trim();

    if (!name) return null;

    return {
      name,
      companyName: textOrNull(get("companyName")),
      email: textOrNull(get("email")),
      phone: textOrNull(get("phone")),
      title: textOrNull(get("title")),
      value: parseValue(get("value")),
      stage: parseStage(get("stage"), intoPipeline ? "new_lead" : "contact"),
      nextActionText: textOrNull(get("nextActionText")),
      nextActionDue: parseDate(get("nextActionDue")),
    };
  }

  const hasName = !!columnFor("name") || !!columnFor("firstName");
  const prepared = rows.map(buildRow);
  const valid = prepared.filter((r): r is ImportRow => r !== null);
  const skippedNoName = prepared.length - valid.length;

  async function runImport() {
    setImporting(true);
    setError(null);
    setProgress(0);

    let inserted = 0;
    let skippedDuplicate = 0;

    try {
      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE);
        const res = await importLeads(chunk, skipDuplicates);

        if (res.error) {
          setError(res.error);
          setImporting(false);
          return;
        }

        inserted += res.inserted;
        skippedDuplicate += res.skippedDuplicate;
        setProgress(Math.min(i + CHUNK_SIZE, valid.length));
      }

      setResult({ inserted, skippedDuplicate, skippedNoName });
      setStep("done");
    } catch {
      setError("The import stopped partway. Some rows may have been added.");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-green-600" />
        <h2 className="text-lg font-semibold text-slate-900">
          Imported {result.inserted.toLocaleString()}{" "}
          {result.inserted === 1 ? "lead" : "leads"}
        </h2>
        <div className="mt-2 flex flex-col gap-0.5 text-sm text-slate-600">
          {result.skippedDuplicate > 0 && (
            <p>
              Skipped {result.skippedDuplicate.toLocaleString()} with an email
              already in your pipeline.
            </p>
          )}
          {result.skippedNoName > 0 && (
            <p>
              Skipped {result.skippedNoName.toLocaleString()} with no name.
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/pipeline">View pipeline</Link>}
          />
          <Button variant="outline" onClick={reset}>
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Which column is which?</h2>
            <Button variant="ghost" size="sm" onClick={reset}>
              Choose a different file
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            {fileName} · {rows.length.toLocaleString()} rows. We guessed where
            each column goes. Change anything we got wrong, and set columns you
            do not need to &quot;Skip&quot;.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {headers.map((header) => {
              const sample = rows.find((r) => r[header]?.trim())?.[header];
              return (
                <li
                  key={header}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {header}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {sample ? `e.g. ${sample}` : "No values in this column"}
                    </p>
                  </div>

                  <Select
                    value={mapping[header] || "__skip"}
                    onValueChange={(next) =>
                      setMapping((prev) => ({
                        ...prev,
                        [header]: next === "__skip" ? "" : (next as FieldKey),
                      }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue>{(value) => fieldLabel(value)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip">Skip this column</SelectItem>
                      {IMPORT_FIELDS.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              );
            })}
          </ul>
        </div>

        {valid.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Preview of the first {Math.min(3, valid.length)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Company</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Phone</th>
                    <th className="px-4 py-2 font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valid.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-slate-900">{row.name}</td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.companyName ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {row.email ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {normalizePhone(row.phone) ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.stage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span>
              Skip anyone whose email already exists
              <span className="block text-xs text-slate-500">
                Prevents duplicates if you import the same list twice.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={intoPipeline}
              onChange={(e) => setIntoPipeline(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span>
              These are live deals. Put them straight on the board.
              <span className="block text-xs text-slate-500">
                Off by default. Imported people land in Contacts, and you move
                them onto the board when they show interest. Only tick this if
                every row is genuinely being worked.
              </span>
            </span>
          </label>
        </div>

        {!hasName && (
          <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <TriangleAlert className="size-4 shrink-0" />
            Tell us which column has the person&rsquo;s name before importing.
          </p>
        )}

        {skippedNoName > 0 && hasName && (
          <p className="text-sm text-slate-500">
            {skippedNoName.toLocaleString()} row
            {skippedNoName === 1 ? "" : "s"} have no name and will be skipped.
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={runImport}
            disabled={!hasName || valid.length === 0 || importing}
          >
            {importing
              ? `Importing ${progress.toLocaleString()} of ${valid.length.toLocaleString()}...`
              : `Import ${valid.length.toLocaleString()} lead${valid.length === 1 ? "" : "s"}`}
          </Button>
          {!importing && (
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <label
        htmlFor="csv"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-10 text-center transition-colors hover:border-[var(--brand)] hover:bg-slate-50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <FileUp className="size-8 text-slate-400" />
        <span className="font-medium text-slate-900">
          Drop a CSV here, or click to choose one
        </span>
        <span className="text-sm text-slate-500">
          The first row should be your column headings
        </span>
      </label>

      <input
        ref={inputRef}
        id="csv"
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
