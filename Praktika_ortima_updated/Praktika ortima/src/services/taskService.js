import { state } from "../store.js";
import { save } from "./persistence.js";
import { nowISO, uid } from "../utils.js";
import { makeTask } from "../models/taskModel.js";
import { activityService } from "./activityService.js";

export const taskService = {
  createTask(data) {
    const t = makeTask({
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      tags: data.tags,
    });

    state.tasks.unshift(t);
    activityService.log("create", `Task created: "${t.title}".`, { taskId: t.id });
    save();
    return t;
  },

  updateTask(taskId, data) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    const before = {
      status: t.status,
      assigneeId: t.assigneeId,
      priority: t.priority,
      dueDate: t.dueDate,
    };

    Object.assign(t, data, { updatedAt: nowISO() });

    if (before.status !== t.status)
      activityService.log(
        "status",
        `Status changed: "${t.title}" ${before.status} → ${t.status}`,
        { taskId: t.id }
      );

    if (before.assigneeId !== t.assigneeId)
      activityService.log("assignee", `Reassigned: "${t.title}".`, { taskId: t.id });

    if (before.priority !== t.priority)
      activityService.log(
        "prio",
        `Priority changed: "${t.title}" ${before.priority} → ${t.priority}`,
        { taskId: t.id }
      );

    if (before.dueDate !== t.dueDate)
      activityService.log("due", `Due date updated: "${t.title}".`, { taskId: t.id });

    save();
    return { ok: true, task: t };
  },

  deleteTask(taskId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    state.tasks = state.tasks.filter((x) => x.id !== taskId);
    activityService.log("delete", `Task deleted: "${t.title}".`, { taskId });
    save();
    return { ok: true };
  },

  addChecklistItem(taskId, text) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    const cleaned = (text || "").trim();
    if (!cleaned) return { ok: false, message: "Checklist text is empty." };

    t.checklist = t.checklist || [];
    t.checklist.push({ id: uid(), text: cleaned, done: false });
    t.updatedAt = nowISO();

    activityService.log("check", `Added checklist item in "${t.title}".`, { taskId });
    save();
    return { ok: true, task: t };
  },

  toggleChecklistItem(taskId, itemId, done) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    const item = (t.checklist || []).find((x) => x.id === itemId);
    if (!item) return { ok: false, message: "Checklist item not found." };

    item.done = !!done;
    t.updatedAt = nowISO();
    save();
    return { ok: true, task: t };
  },

  deleteChecklistItem(taskId, itemId) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    t.checklist = (t.checklist || []).filter((x) => x.id !== itemId);
    t.updatedAt = nowISO();

    activityService.log("check", `Checklist updated in "${t.title}".`, { taskId });
    save();
    return { ok: true, task: t };
  },

  addComment(taskId, text) {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { ok: false, message: "Task not found." };

    const cleaned = (text || "").trim();
    if (!cleaned) return { ok: false, message: "Comment text is empty." };

    t.comments = t.comments || [];
    t.comments.push({ id: uid(), authorId: t.assigneeId, text: cleaned, ts: nowISO() });
    t.updatedAt = nowISO();

    activityService.log("comment", `Comment added in "${t.title}".`, { taskId });
    save();
    return { ok: true, task: t };
  },

  /**
   * “Главная логика” для dnd: синхронизировать статус и порядок задач по DOM.
   * Пригодится для отчёта как core loop / основной компонент.
   */
  syncStatusAndOrderFromDOM({ colOpen, colProgress, colDone }) {
    const apply = (container, status) => {
      const cards = [...container.querySelectorAll(".task-card")];
      cards.forEach((card, idx) => {
        const id = card.dataset.id;
        const t = state.tasks.find((x) => x.id === id);
        if (!t) return;

        const prev = t.status;
        t.status = status;
        t.order = idx + (status === "Open" ? 0 : status === "In Progress" ? 10000 : 20000);
        t.updatedAt = nowISO();

        if (prev !== status) {
          activityService.log("move", `Task "${t.title}" moved to "${status}".`, {
            taskId: t.id,
            from: prev,
            to: status,
          });
        }
      });
    };

    apply(colOpen, "Open");
    apply(colProgress, "In Progress");
    apply(colDone, "Done");

    save();
  },
};
