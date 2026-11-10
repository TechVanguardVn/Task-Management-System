import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  localInputToUtcIso,
  parseApiDate,
  utcIsoToLocalInput,
} from "./date";

describe("date utilities", () => {
  describe("parseApiDate", () => {
    it("returns null for null, undefined, or empty strings", () => {
      expect(parseApiDate(null)).toBeNull();
      expect(parseApiDate(undefined)).toBeNull();
      expect(parseApiDate("")).toBeNull();
    });

    it("parses UTC ISO strings with Z", () => {
      const date = parseApiDate("2026-11-20T09:30:00Z");
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe("2026-11-20T09:30:00.000Z");
    });

    it("treats offset-less timestamps as UTC by appending Z", () => {
      const date = parseApiDate("2026-11-20T09:30:00");
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe("2026-11-20T09:30:00.000Z");
    });

    it("returns null for invalid date strings", () => {
      expect(parseApiDate("not-a-date")).toBeNull();
    });
  });

  describe("localInputToUtcIso", () => {
    it("returns null for null, undefined, or empty values", () => {
      expect(localInputToUtcIso(null)).toBeNull();
      expect(localInputToUtcIso(undefined)).toBeNull();
      expect(localInputToUtcIso("")).toBeNull();
    });

    it("returns null for malformed strings", () => {
      expect(localInputToUtcIso("2026-11-20")).toBeNull();
      expect(localInputToUtcIso("invalid")).toBeNull();
    });

    it("returns null for calendar-impossible dates like Feb 30", () => {
      expect(localInputToUtcIso("2026-02-30T10:00")).toBeNull();
    });

    it("converts a valid local datetime-local string to UTC ISO string with Z", () => {
      const iso = localInputToUtcIso("2026-11-20T14:30");
      expect(iso).toBeTruthy();
      expect(iso?.endsWith("Z")).toBe(true);

      const parsed = new Date(iso!);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe("utcIsoToLocalInput", () => {
    it("returns empty string for null, undefined, or empty values", () => {
      expect(utcIsoToLocalInput(null)).toBe("");
      expect(utcIsoToLocalInput(undefined)).toBe("");
      expect(utcIsoToLocalInput("")).toBe("");
    });

    it("converts an API timestamp into YYYY-MM-DDTHH:mm format", () => {
      const localInput = utcIsoToLocalInput("2026-11-20T09:30:00Z");
      expect(localInput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it("round-trips between localInputToUtcIso and utcIsoToLocalInput", () => {
      const input = "2026-11-20T15:45";
      const utcIso = localInputToUtcIso(input);
      expect(utcIso).not.toBeNull();
      const backToInput = utcIsoToLocalInput(utcIso!);
      expect(backToInput).toBe(input);
    });
  });

  describe("formatDateTime and formatDate", () => {
    it("formats dates using vi-VN locale by default", () => {
      const formatted = formatDateTime("2026-11-20T09:30:00Z", "vi-VN");
      expect(formatted).not.toBe("—");
      expect(formatted.length).toBeGreaterThan(5);
    });

    it("returns fallback string when date is null or invalid", () => {
      expect(formatDateTime(null, "vi-VN", "Chưa đặt hạn")).toBe("Chưa đặt hạn");
      expect(formatDate(null, "vi-VN", "Không có ngày")).toBe("Không có ngày");
    });
  });
});

