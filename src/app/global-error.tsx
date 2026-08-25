"use client";

import { useEffect } from "react";

/**
 * The last thing standing between a crash and a blank white page.
 *
 * Only fires when an error escapes the root layout, which is rare and
 * therefore exactly the kind nobody finds out about. It reports itself on
 * the way past, because a client-side crash never reaches the server hook
 * and would otherwise leave no trace at all.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack?.slice(0, 4000),
        digest: error.digest,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {
      // Reporting must never be the reason a broken page gets worse.
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#fff",
          }}
        >
          <div style={{ maxWidth: "26rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16181c" }}>
              Something broke.
            </h1>
            <p style={{ marginTop: "0.75rem", color: "#585c63", lineHeight: 1.6 }}>
              Not your fault, and nothing you entered has been lost. We have
              been told about it.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                borderRadius: "0.6rem",
                border: "none",
                background: "#f16522",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
