import Link from "next/link";
import { redirect } from "next/navigation";
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
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
        <p className="mb-4 text-sm text-destructive">{result.error}</p>
        <Link href="/" className="text-sm text-neutral-400 hover:underline">
          Back to the app
        </Link>
      </div>
    </main>
  );
}
