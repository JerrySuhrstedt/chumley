import { notFound } from "next/navigation";
import { Harness } from "./harness";

/**
 * A board-shaped page for eyeballing the onboarding tour.
 *
 * The tour is only reachable behind sign-in on a real team with seeded
 * cards, which makes "does the spotlight land on the card" a question that
 * can only be answered by a human with an account. That is how two rounds
 * of guesswork happened. This renders the same shapes in the same places
 * with nothing else attached, so the answer is a screenshot.
 *
 * Development only, and 404s otherwise, so it cannot ship by accident.
 */
export default function CoachHarnessPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Harness />;
}
