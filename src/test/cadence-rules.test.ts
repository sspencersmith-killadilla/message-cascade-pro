import { describe, it, expect } from "vitest";
import { canSendCascades, isCascadeRecipientRole, isOverdue, completionStats, needsReminder, validateImport } from "@/lib/cadence";

const today = new Date("2026-10-12T12:00:00Z");

describe("cadence rules", () => {
  it("only owners and admins can send cascades", () => {
    expect(canSendCascades("owner")).toBe(true);
    expect(canSendCascades("admin")).toBe(true);
    expect(canSendCascades("manager")).toBe(false);
    expect(canSendCascades("member")).toBe(false);
  });

  it("overdue means deadline passed and not shared", () => {
    expect(isOverdue("2026-10-11", null, today)).toBe(true);
    expect(isOverdue("2026-10-12", null, today)).toBe(false);
    expect(isOverdue("2026-10-11", "2026-10-10T00:00:00Z", today)).toBe(false);
    expect(isOverdue(null, null, today)).toBe(false);
  });

  it("computes completion percentages", () => {
    const s = completionStats([
      { acknowledged_at: "x", shared_at: "x", responded: true },
      { acknowledged_at: "x", shared_at: null },
      { acknowledged_at: null, shared_at: null },
      { acknowledged_at: null, shared_at: null },
    ]);
    expect(s.acknowledgedPct).toBe(50);
    expect(s.sharedPct).toBe(25);
    expect(s.respondedPct).toBe(25);
  });

  it("reminds within the days-before window only once", () => {
    expect(needsReminder("2026-10-14", null, null, 2, today)).toBe(true);
    expect(needsReminder("2026-10-15", null, null, 2, today)).toBe(false);
    expect(needsReminder("2026-10-14", null, "2026-10-12", 2, today)).toBe(false);
  });

  it("people listed as someone's manager become managers on import", () => {
    const rows = validateImport([
      { Name: "Ana", Email: "ana@x.org", "Manager Email": "" },
      { Name: "Ben", Email: "ben@x.org", "Manager Email": "ana@x.org" },
    ]);
    expect(rows[0]!.role).toBe("manager");
    expect(rows[1]!.role).toBe("member");
    expect(validateImport([{ Name: "", Email: "bad" }])[0]!.errors).toContain("Invalid email");
  });
});

describe("admins who are also managers", () => {
  it("receive cascades only when marked as leading a team", () => {
    expect(isCascadeRecipientRole("manager")).toBe(true);
    expect(isCascadeRecipientRole("admin")).toBe(false);
    expect(isCascadeRecipientRole("admin", true)).toBe(true);
    expect(isCascadeRecipientRole("owner", true)).toBe(true);
    expect(isCascadeRecipientRole("member", true)).toBe(false);
  });
  it("admins listed as someone's manager are flagged on import", () => {
    const rows = validateImport([
      { name: "Ava", email: "ava@x.org", role: "admin" },
      { name: "Ben", email: "ben@x.org", manager: "ava@x.org" },
    ]);
    expect(rows[0]!.role).toBe("admin");
    expect(rows[0]!.leads_team).toBe(true);
  });
});
