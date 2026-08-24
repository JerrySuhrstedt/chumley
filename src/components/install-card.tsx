"use client";

import { Check, Smartphone } from "lucide-react";
import { IosSteps } from "@/components/install-steps";
import { runInstall, useInstall } from "@/components/use-install";

/**
 * The install offer, permanently. The banner can be dismissed forever with
 * one tap, and before this there was no way back to it.
 */
export function InstallCard() {
  const { event, ios, browser, installed, ready } = useInstall();

  if (!ready) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          {installed ? (
            <Check className="size-5 text-emerald-600" strokeWidth={3} />
          ) : (
            <Smartphone className="size-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">
            {installed ? "Chumley is on your home screen" : "Add to your home screen"}
          </p>

          {installed ? (
            <p className="mt-0.5 text-sm text-slate-500">
              You are using the installed app right now.
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-slate-500">
                Opens like a normal app, with no browser bar taking up the
                screen, and sits with your other apps.
              </p>

              {event && (
                <button
                  type="button"
                  onClick={() => runInstall(event)}
                  className="mt-3 rounded-lg bg-[var(--board-bg)] px-4 py-2 text-sm font-bold text-white"
                >
                  Add it
                </button>
              )}

              {!event && ios && <IosSteps browser={browser} />}

              {!event && !ios && (
                // Desktop Chrome puts it in the address bar; Firefox has no
                // install at all. Better to say so than to show a button
                // that cannot do anything.
                <p className="mt-2 text-sm text-slate-500">
                  Open Chumley on your phone to add it to your home screen. On a
                  desktop, look for the install icon at the right-hand end of
                  the address bar.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
