// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { boxFor, placeBubble } from "@/app/(app)/_onboarding/coach-marks";

/**
 * What the onboarding tour points at.
 *
 * The bug this locks down: the three sample leads are seeded into three
 * different stages, so on a kanban board they sit in three separate
 * columns. boxFor took the union of every match, which across three columns
 * is a rectangle spanning the whole board. The spotlight highlighted
 * everything, which is the same as highlighting nothing.
 */

/** A stand-in for a card at a known place on screen. */
function place(target: string, rect: { top: number; left: number; width: number; height: number }, visible = true) {
  const el = document.createElement("div");
  if (target) el.setAttribute("data-coach", target);
  el.getBoundingClientRect = () =>
    ({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
  // jsdom has no layout, so offsetParent is always null. The filter in
  // boxFor reads it, so it has to be defined per element here.
  Object.defineProperty(el, "offsetParent", {
    get: () => (visible ? document.body : null),
  });
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("boxFor", () => {
  it("points at one card, not the span of all three", () => {
    // Three sample cards, three columns, spread right across the board.
    place("sample-lead", { top: 200, left: 40, width: 260, height: 120 });
    place("sample-lead", { top: 200, left: 340, width: 260, height: 120 });
    place("sample-lead", { top: 200, left: 640, width: 260, height: 120 });

    const box = boxFor("sample-lead")!;
    expect(box.left).toBe(40);
    expect(box.width).toBe(260);
    // The union would have been 860 wide, most of the screen.
    expect(box.width).toBeLessThan(300);
  });

  it("measures a single target exactly", () => {
    place("add-lead", { top: 96, left: 880, width: 132, height: 40 });
    expect(boxFor("add-lead")).toEqual({
      top: 96,
      left: 880,
      width: 132,
      height: 40,
    });
  });

  it("skips a hidden match and takes the visible one", () => {
    // The board renders a mobile and a desktop variant of some controls.
    // Pointing at the hidden one puts the spotlight nowhere.
    place("add-lead", { top: 0, left: 0, width: 0, height: 0 }, false);
    place("add-lead", { top: 96, left: 880, width: 132, height: 40 }, true);
    expect(boxFor("add-lead")?.left).toBe(880);
  });

  it("returns null when the target is not on the page", () => {
    expect(boxFor("does-not-exist")).toBeNull();
  });

  it("returns null when every match is hidden", () => {
    place("add-lead", { top: 10, left: 10, width: 10, height: 10 }, false);
    expect(boxFor("add-lead")).toBeNull();
  });
});

describe("placeBubble", () => {
  const vp = { width: 1440, height: 900 };

  it("keeps a right-edge target's bubble fully on screen", () => {
    // The "Add a lead" button: hard against the right of the header.
    const hole = { top: 96, left: 1250, width: 146, height: 56 };
    const b = placeBubble(hole, vp);
    expect(b.left).toBeGreaterThanOrEqual(16);
    expect(b.left + b.width).toBeLessThanOrEqual(vp.width - 16);
  });

  it("hangs a right-edge bubble off the button's right edge", () => {
    // Left-aligning was tried first and does not fit: a 340px bubble from a
    // button 190px off the edge overflows, so the clamp puts it back exactly
    // where centring had it. Aligning the right edges is what actually moves
    // the bubble under the button.
    const hole = { top: 96, left: 1250, width: 146, height: 56 };
    const b = placeBubble(hole, vp);
    expect(b.left + b.width).toBeCloseTo(hole.left + hole.width, 0);
    expect(b.left + b.width).toBeLessThanOrEqual(vp.width - 16);
  });

  it("centres a bubble under a target in the middle of the board", () => {
    const hole = { top: 300, left: 600, width: 260, height: 120 };
    const b = placeBubble(hole, vp);
    const centre = hole.left + hole.width / 2;
    expect(Math.abs(b.left + b.width / 2 - centre)).toBeLessThan(2);
  });

  it("keeps a left-edge target's bubble on screen too", () => {
    const hole = { top: 300, left: 8, width: 260, height: 120 };
    const b = placeBubble(hole, vp);
    expect(b.left).toBeGreaterThanOrEqual(16);
  });

  it("always points the arrow at the target, never off the bubble", () => {
    for (const left of [0, 200, 700, 1100, 1400]) {
      const hole = { top: 300, left, width: 140, height: 60 };
      const b = placeBubble(hole, vp);
      expect(b.arrowLeft).toBeGreaterThanOrEqual(18);
      expect(b.arrowLeft).toBeLessThanOrEqual(b.width - 34);
    }
  });

  it("flips above the target when there is no room below", () => {
    expect(placeBubble({ top: 800, left: 400, width: 200, height: 60 }, vp).below).toBe(false);
    expect(placeBubble({ top: 120, left: 400, width: 200, height: 60 }, vp).below).toBe(true);
  });

  it("narrows the bubble on a phone rather than overflowing it", () => {
    const phone = { width: 375, height: 812 };
    const b = placeBubble({ top: 200, left: 20, width: 335, height: 120 }, phone);
    expect(b.width).toBeLessThanOrEqual(375 - 32);
    expect(b.left + b.width).toBeLessThanOrEqual(phone.width - 16);
  });
});
