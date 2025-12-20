import { mkTask } from "../utils.js";

/**
 * Просто тонкая обёртка над mkTask, чтобы в отчёте было красиво:
 * "модели вынесены в отдельный слой".
 */
export function makeTask(data) {
  return mkTask(
    data.title,
    data.description || "",
    data.assigneeId || "",
    data.status || "Open",
    data.priority || "Medium",
    data.dueDate || "",
    data.tags || []
  );
}
