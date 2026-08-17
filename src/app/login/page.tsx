import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-1 text-xl font-semibold text-neutral-50">
          Stupid Simple CRM
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          Your sales pipeline, minus the clutter.
        </p>
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </main>
  );
}
