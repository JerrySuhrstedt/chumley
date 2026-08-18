import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authLink } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/org";
import { joinOrg } from "./actions";

export default async function JoinPage({
  params,
}: PageProps<"/join/[token]">) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/join/${token}`);
  }

  const result = await joinOrg(token);

  if (!result.error) {
    redirect("/pipeline");
  }

  return (
    <AuthShell>
      <h1 className="text-center text-2xl font-semibold text-slate-800">
        Can&apos;t join this team
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">{result.error}</p>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className={authLink}>
          Go to your pipeline
        </Link>
      </p>
    </AuthShell>
  );
}
