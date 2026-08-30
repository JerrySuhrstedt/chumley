import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

/**
 * Every way a sign-in can fail, in words a person can act on. Keyed by
 * the error codes better-auth sends back to its errorCallbackURL, plus
 * our own. Unknown codes get the generic line rather than being echoed:
 * the query string is attacker-writable, and reflecting it turns the
 * login page into a message board.
 */
const ERROR_COPY: Record<string, string> = {
  "invalid-link": "That sign-in link has expired. Try again.",
  INVALID_TOKEN: "That sign-in link has expired. Try again.",
  account_not_linked:
    "You already have a Chumley account with this email. Sign in with your email below; once your address is verified, Google and LinkedIn will work too.",
  email_not_verified:
    "That email isn't verified yet. Use the magic link below and it verifies itself.",
  provider_unavailable:
    "That sign-in service isn't answering right now. Use your email below.",
  access_denied: "Sign-in was cancelled.",
  state_not_found: "That sign-in attempt expired. Start it again.",
  please_restart_the_process: "That sign-in attempt expired. Start it again.",
  state_mismatch: "That sign-in attempt expired. Start it again.",
};

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
          typeof error === "string"
            ? (ERROR_COPY[error] ?? "Sign-in didn't complete. Try again.")
            : undefined
        }
      />
    </AuthShell>
  );
}
