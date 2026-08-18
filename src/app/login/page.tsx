import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <AuthShell>
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        initialError={
          error === "invalid-link"
            ? "That sign-in link has expired. Try again."
            : typeof error === "string"
              ? error
              : undefined
        }
      />
    </AuthShell>
  );
}
