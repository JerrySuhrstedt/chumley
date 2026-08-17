import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <AuthShell>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
