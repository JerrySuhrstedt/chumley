"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminPromoCode } from "@/lib/admin-data";
import {
  adminArchivePromoCode,
  adminCreatePromoCode,
  type PromoKind,
} from "./promo-actions";

/** What a code is worth, in one readable cell. */
function worth(c: AdminPromoCode) {
  if (c.kind === "percent") return `${c.value}% off`;
  if (c.kind === "amount") return `$${(c.value / 100).toFixed(0)} off`;
  return `${c.value} free days`;
}

export function PromoCodes({ codes }: { codes: AdminPromoCode[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [working, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PromoKind>("percent");
  const [value, setValue] = useState("20");
  const [limit, setLimit] = useState("");
  const [expires, setExpires] = useState("");

  const create = () =>
    start(async () => {
      const r = await adminCreatePromoCode({
        code,
        name,
        kind,
        value: Number(value),
        maxRedemptions: limit.trim() ? Number(limit) : null,
        expiresAt: expires.trim() || null,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? "Created.");
      setCreating(false);
      setCode("");
      setName("");
      router.refresh();
    });

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Promo codes ({codes.filter((c) => !c.archived).length} live)
          </h2>
          <p className="text-xs text-slate-500">
            Percent and dollar codes are entered at checkout. Free-time codes
            are entered on the billing page before a team subscribes.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New code
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Tag className="size-6 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No codes yet</p>
          <p className="max-w-[40ch] text-xs text-slate-500">
            Create one, put it on a flyer, and watch the redemptions column.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {["Code", "Campaign", "Worth", "Used", "Expires", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map((c) => (
                <tr key={c.id} className={c.archived ? "opacity-45" : ""}>
                  <td className="px-3 py-2 font-mono text-[13px] font-semibold whitespace-nowrap text-slate-900">
                    {c.code}
                    <button
                      type="button"
                      aria-label={`Copy ${c.code}`}
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        setCopied(c.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      className="ml-1.5 inline-flex align-middle text-slate-400 hover:text-slate-700"
                    >
                      {copied === c.id ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{c.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                        c.kind === "free_days"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {worth(c)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 tabular-nums">
                    {c.redemptions}
                    {c.maxRedemptions !== null && ` of ${c.maxRedemptions}`}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {c.archived
                      ? "retired"
                      : c.expiresAt
                        ? c.expiresAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "never"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!c.archived && (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          start(async () => {
                            const r = await adminArchivePromoCode(c.id);
                            if (r.error) toast.error(r.error);
                            else {
                              toast.success(r.message ?? "Retired.");
                              router.refresh();
                            }
                          })
                        }
                        className="text-xs font-semibold text-slate-500 hover:text-red-600"
                      >
                        Retire
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New promo code</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="promo-code">
                Code people will type
              </label>
              <Input
                id="promo-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LAUNCH20"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="promo-name">
                Campaign name
              </label>
              <Input
                id="promo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Launch week newsletter"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">
                What it gives
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["percent", "% off"],
                    ["amount", "$ off"],
                    ["free_days", "Free time"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      setValue(k === "percent" ? "20" : k === "amount" ? "50" : "30");
                    }}
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                      kind === k
                        ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="promo-value">
                {kind === "percent"
                  ? "Percent off the first payment"
                  : kind === "amount"
                    ? "Dollars off the first payment"
                    : "Days of free access"}
              </label>
              {kind === "free_days" ? (
                <div className="grid grid-cols-3 gap-2">
                  {[14, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValue(String(d))}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                        value === String(d)
                          ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  id="promo-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min={1}
                  max={kind === "percent" ? 100 : 10000}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="promo-limit">
                  Max uses
                </label>
                <Input
                  id="promo-limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="Unlimited"
                  min={1}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="promo-expires">
                  Expires
                </label>
                <Input
                  id="promo-expires"
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                />
              </div>
            </div>

            <Button loading={working} onClick={create} className="mt-1">
              Create code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
