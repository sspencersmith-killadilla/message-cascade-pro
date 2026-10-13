// Pure, browser-safe business rules for Cadence.

export type OrgRole = "owner" | "admin" | "manager" | "member";

export interface RecipientLike {
  acknowledged_at: string | null;
  shared_at: string | null;
  responded?: boolean;
  department?: string | null;
}

/** Owners and admins send cascades; managers and members never do. */
export function canSendCascades(role: OrgRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Only managers (and admins who also lead teams) receive cascades to pass on. */
export function isCascadeRecipientRole(role: OrgRole, leadsTeam = false): boolean {
  return role === "manager" || ((role === "admin" || role === "owner") && leadsTeam);
}

/** Overdue = deadline has passed (deadline day is still on time) and the manager hasn't shared it yet. */
export function isOverdue(deadline: string | null | undefined, sharedAt: string | null, today: Date = new Date()): boolean {
  if (!deadline || sharedAt) return false;
  const todayStr = toDateStr(today);
  return deadline < todayStr;
}

/** Days until deadline (negative when past). */
export function daysUntil(deadline: string, today: Date = new Date()): number {
  const a = Date.UTC(...ymd(deadline));
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((a - t) / 86400000);
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ymd(s: string): [number, number, number] {
  const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
  return [y, m - 1, d];
}

export function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

export function completionStats(recipients: RecipientLike[]) {
  const total = recipients.length;
  const acknowledged = recipients.filter((r) => r.acknowledged_at || r.shared_at).length;
  const shared = recipients.filter((r) => r.shared_at).length;
  const responded = recipients.filter((r) => r.responded).length;
  return {
    total,
    acknowledged,
    shared,
    responded,
    acknowledgedPct: pct(acknowledged, total),
    sharedPct: pct(shared, total),
    respondedPct: pct(responded, total),
  };
}

export function statsByDepartment(recipients: RecipientLike[]) {
  const groups = new Map<string, RecipientLike[]>();
  for (const r of recipients) {
    const k = r.department?.trim() || "No department";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return [...groups.entries()]
    .map(([department, rs]) => ({ department, ...completionStats(rs) }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

/** Should a pre-deadline reminder go out today? */
export function needsReminder(
  deadline: string | null,
  sharedAt: string | null,
  reminderSentAt: string | null,
  daysBefore: number,
  today: Date = new Date(),
): boolean {
  if (!deadline || sharedAt || reminderSentAt) return false;
  const d = daysUntil(deadline, today);
  return d >= 0 && d <= daysBefore;
}

export interface ImportRow {
  full_name: string;
  email: string;
  title?: string;
  department?: string;
  manager_email?: string;
  role?: string;
}

export interface ValidatedRow extends ImportRow {
  role: OrgRole;
  errors: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize spreadsheet rows; anyone listed as someone's manager becomes a manager. */
export function validateImport(rows: Record<string, unknown>[]): ValidatedRow[] {
  const norm = rows.map((raw) => {
    const get = (...keys: string[]) => {
      for (const k of Object.keys(raw)) {
        const nk = k.toLowerCase().replace(/[^a-z]/g, "");
        if (keys.includes(nk)) return String(raw[k] ?? "").trim();
      }
      return "";
    };
    return {
      full_name: get("name", "fullname"),
      email: get("email", "emailaddress").toLowerCase(),
      title: get("title", "jobtitle"),
      department: get("department", "dept", "team"),
      manager_email: get("manageremail", "manager", "reportsto").toLowerCase(),
      role: get("role").toLowerCase(),
    };
  });
  const managerEmails = new Set(norm.map((r) => r.manager_email).filter(Boolean));
  const seen = new Map<string, number>();
  for (const r of norm) seen.set(r.email, (seen.get(r.email) ?? 0) + 1);
  return norm.map((r) => {
    const errors: string[] = [];
    if (!r.full_name) errors.push("Missing name");
    if (!EMAIL_RE.test(r.email)) errors.push("Invalid email");
    if ((seen.get(r.email) ?? 0) > 1) errors.push("Duplicate email");
    if (r.manager_email && !EMAIL_RE.test(r.manager_email)) errors.push("Invalid manager email");
    let role: OrgRole = "member";
    if (r.role === "admin") role = "admin";
    else if (r.role === "manager" || managerEmails.has(r.email)) role = "manager";
    return { ...r, role, errors };
  });
}
