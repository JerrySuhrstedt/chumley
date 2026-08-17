import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-1 text-xl font-semibold text-neutral-50">
          Mini CRM
        </h1>
        <p className="mb-6 text-sm text-neutral-400">
          Sign in with a magic link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
