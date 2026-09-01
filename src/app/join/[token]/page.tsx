import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authLink } from "@/components/auth-shell";
import { inspectInvite } from "./actions";
import { JoinConfirm } from "./join-confirm";

/**
 * Reading this page never changes anything: it inspects the invite and
 * renders a confirmation. Joining is a deliberate button press, so a
 * prefetch, a link scanner, or an address-bar preload cannot seat a
 * signed-in user on a team they never chose.
 */
export default async function JoinPage({
  params,
}: PageProps<"/join/[token]">) {
  const { token } = await params;
  const invite = await inspectInvite(token);

  if (invite.state === "signed-out") {
    redirect(`/login?next=/join/${token}`);
  }
  if (invite.state === "already-here") {
    redirect("/pipeline");
  }

  return (
    <AuthShell>
      {invite.state === "ready" ? (
        <JoinConfirm token={token} orgName={invite.orgName} />
      ) : (
        <>
          <h1 className="text-center text-2xl font-semibold text-slate-800">
            Can&apos;t join this team
          </h1>
          <p className="mt-2 text-center text-sm text-slate-600">
            {invite.state === "invalid"
              ? "This invite link is invalid."
              : "You're already on a different team."}
          </p>
          <p className="mt-6 text-center text-sm">
            <Link href="/" className={authLink}>
              Go to your pipeline
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
