export function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowISO() {
  return new Date().toISOString();
}

export function esc(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function asTags(str) {
  return (str ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function fmtDate(d) {
  if (!d) return "";
  return dayjs(d).format("DD.MM.YYYY");
}

export function isOverdue(t) {
  if (!t.dueDate) return false;
  return dayjs(t.dueDate).endOf("day").isBefore(dayjs()) && t.status !== "Done";
}

export function badgeStatus(s) {
  if (s === "Done") return "text-bg-success";
  if (s === "In Progress") return "text-bg-warning";
  return "text-bg-secondary";
}

export function badgePriority(p) {
  if (p === "High") return "text-bg-danger";
  if (p === "Medium") return "text-bg-primary";
  return "text-bg-secondary";
}

export function plusDays(n) {
  return dayjs().add(n, "day").format("YYYY-MM-DD");
}

export function mkTask(
  title,
  description,
  assigneeId,
  status = "Open",
  priority = "Medium",
  dueDate = "",
  tags = []
) {
  return {
    id: uid(),
    title,
    description,
    assigneeId,
    status,
    priority,
    dueDate: dueDate || "",
    tags: tags || [],
    checklist: [],
    comments: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    order: Date.now() + Math.random(),
  };
}
