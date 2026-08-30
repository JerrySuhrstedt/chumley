import { isIos } from "@/components/use-install";

/**
 * Whether this device can plausibly place a phone call itself.
 *
 * Capability and hand-off detection used to be one signal: "nothing
 * answered the tel: click inside 1.5s" was read as "this machine has no
 * dialer". Firefox for Android broke that, because its open-in-app
 * doorhanger is browser chrome over a still-visible page, so no signal
 * arrives until after the user decides, and a phone got told it was a
 * computer. Capability is a property of the device, so it is answered
 * from the device, not from event timing.
 *
 * UA-first on purpose: a touchscreen Windows laptop matches
 * (pointer: coarse) but still cannot place a call, and the desktop
 * no-dialer dialog must keep appearing there.
 *
 * Call from an effect after mount, never during render — the server has
 * no navigator and the first client render must match it.
 */
export function canDial(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent) || isIos();
}
