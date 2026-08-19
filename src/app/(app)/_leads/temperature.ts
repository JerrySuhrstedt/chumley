import { Flame, Snowflake, Sun } from "lucide-react";
import type { LeadTemperature } from "./actions";

export const TEMPERATURES: {
  value: LeadTemperature;
  label: string;
  icon: typeof Flame;
  /** Fill when chosen. */
  bg: string;
  /** Outline and icon when not chosen. */
  ink: string;
  ring: string;
}[] = [
  {
    value: "hot",
    label: "Hot",
    icon: Flame,
    bg: "#e0402c",
    ink: "#c2381f",
    ring: "rgba(224,64,44,0.35)",
  },
  {
    value: "warm",
    label: "Warm",
    icon: Sun,
    bg: "#e08a1e",
    ink: "#b06a12",
    ring: "rgba(224,138,30,0.35)",
  },
  {
    value: "cold",
    label: "Cold",
    icon: Snowflake,
    bg: "#2f7fd1",
    ink: "#2569ad",
    ring: "rgba(47,127,209,0.35)",
  },
];

export function temperature(value: LeadTemperature | null) {
  return TEMPERATURES.find((t) => t.value === value) ?? null;
}
