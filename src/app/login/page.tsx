import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error, mode } = await searchParams;

  return (
    <AuthShell logo="large">
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        initialMode={mode === "signup" ? "signup" : undefined}
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
