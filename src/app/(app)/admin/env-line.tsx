import { Database, CreditCard, Mail } from "lucide-react";
import { TestAlertButton } from "./test-alert";

/**
 * What this deployment is actually connected to.
 *
 * Exists because the two settings most able to break production quietly are
 * the two nobody can see: whether the database goes through the pooler, and
 * whether Paddle is pointed at live. Both live in environment variables
 * marked sensitive, which means they cannot be read back from the platform
 * once set, so "is production configured correctly" had no answer short of
 * a deploy and a guess.
 *
 * Only the shape is shown, never a credential: host, port and mode for the
 * database, and which Paddle environment for billing. Nothing here is a
 * secret, and all of it is behind the admin gate anyway.
 */
function describeDb(): {
  ok: boolean;
  mode: string;
  detail: string;
} {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { ok: false, mode: "not set", detail: "DATABASE_URL is missing" };

  try {
    const u = new URL(raw);
    const port = u.port || "5432";
    const pooled = u.hostname.includes("pooler");

    if (pooled && port === "6543") {
      return {
        ok: true,
        mode: "transaction pooler",
        detail: `${u.hostname}:${port}`,
      };
    }
    if (pooled && port === "5432") {
      return {
        ok: false,
        mode: "session pooler",
        detail: `${u.hostname}:${port} — use 6543 for serverless`,
      };
    }
    return {
      ok: false,
      mode: "direct connection",
      detail: `${u.hostname}:${port} — every function instance opens its own`,
    };
  } catch {
    return { ok: false, mode: "unreadable", detail: "DATABASE_URL will not parse" };
  }
}

function Line({
  icon,
  label,
  value,
  detail,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={ok ? "text-emerald-600" : "text-amber-600"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700">
          {label}:{" "}
          <span className={ok ? "text-emerald-700" : "text-amber-700"}>
            {value}
          </span>
        </p>
        <p className="truncate text-[11px] text-slate-500" title={detail}>
          {detail}
        </p>
      </div>
    </div>
  );
}

export function EnvLine() {
  const db = describeDb();
  const paddleLive = process.env.PADDLE_ENV === "production";
  const key = process.env.PADDLE_API_KEY ?? "";
  const keyLive = key.startsWith("pdl_live_");

  const alertsOn = Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3">
      <Line
        icon={<Database className="size-4" />}
        label="Database"
        value={db.mode}
        detail={db.detail}
        ok={db.ok}
      />
      <Line
        icon={<CreditCard className="size-4" />}
        label="Billing"
        value={paddleLive ? "live" : "sandbox"}
        detail={
          paddleLive === keyLive
            ? paddleLive
              ? "Live key, live environment. Real cards."
              : "Sandbox key and environment. Nothing is charged."
            : "MISMATCH: the key and the environment disagree, so every Paddle call will fail."
        }
        ok={paddleLive === keyLive}
      />
      <div className="flex items-start justify-between gap-2">
        <Line
          icon={<Mail className="size-4" />}
          label="Alerts"
          value={alertsOn ? "on" : "off"}
          detail={
            alertsOn
              ? "Failures email info@sumolab.co"
              : "RESEND_API_KEY unset. Failures only reach the logs."
          }
          ok={alertsOn}
        />
        {alertsOn && <TestAlertButton />}
      </div>
    </div>
  );
}
