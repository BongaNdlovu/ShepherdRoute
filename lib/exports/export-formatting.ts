import { urgencyOptions, type UrgencyLevel } from "@/lib/constants";

export const urgencyLabels: Record<UrgencyLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

export function formatExportDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function formatExportUrgency(value?: string | null) {
  if (!value) {
    return "";
  }

  return urgencyOptions.includes(value as UrgencyLevel)
    ? urgencyLabels[value as UrgencyLevel]
    : humanizeExportValue(value);
}

export function formatSpreadsheetPhone(value?: string | null) {
  if (!value) {
    return "";
  }

  const phone = value.trim();

  if (!phone) {
    return "";
  }

  return phone.startsWith("'") ? phone : `'${phone}`;
}

export function humanizeExportValue(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
