import { LS, state } from "../store.js";
import { uid, nowISO, mkTask, plusDays } from "../utils.js";

export function save() {
  localStorage.setItem(LS.USERS, JSON.stringify(state.users));
  localStorage.setItem(LS.TASKS, JSON.stringify(state.tasks));
  localStorage.setItem(LS.ACT, JSON.stringify(state.activity));
  localStorage.setItem(LS.SET, JSON.stringify(state.settings));
}

export function load() {
  try {
    state.users = JSON.parse(localStorage.getItem(LS.USERS) || "[]");
    state.tasks = JSON.parse(localStorage.getItem(LS.TASKS) || "[]");
    state.activity = JSON.parse(localStorage.getItem(LS.ACT) || "[]");
    state.settings = JSON.parse(
      localStorage.getItem(LS.SET) || '{"theme":"light","view":"kanban"}'
    );
  } catch {
    state.users = [];
    state.tasks = [];
    state.activity = [];
    state.settings = { theme: "light", view: "kanban" };
  }

  // Seed demo data
  if (!state.users.length) {
    state.users = [
      { id: uid(), name: "Seisha", createdAt: nowISO() },
      { id: uid(), name: "Alex", createdAt: nowISO() },
      { id: uid(), name: "Mira", createdAt: nowISO() },
    ];
  }

  if (!state.tasks.length) {
    state.tasks = [
      mkTask(
        "Make a Kanban with drag & drop",
        "Drag and drop between statuses.",
        state.users[0].id,
        "In Progress",
        "High",
        plusDays(2),
        ["ui", "dnd"]
      ),
      mkTask(
        "Add comments and a checklist",
        "So the task looks like a Jira-lite card.",
        state.users[1].id,
        "Open",
        "Medium",
        plusDays(4),
        ["feature"]
      ),
      mkTask(
        "Collect mini-analytics",
        "Chart.js: status distribution and workload per person.",
        state.users[2].id,
        "Open",
        "Low",
        "",
        ["charts"]
      ),
    ];

    state.activity = [
      { id: uid(), ts: nowISO(), type: "seed", text: "Demo users and tasks were created.", meta: {} },
    ];
  }

  save();
}

export function exportJSON() {
  const payload = {
    users: state.users,
    tasks: state.tasks,
    activity: state.activity,
    settings: state.settings,
    exportedAt: nowISO(),
    version: 1,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "task-manager-pro-export.json";
  a.click();

  URL.revokeObjectURL(url);
}

export async function importJSONFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!Array.isArray(data.users) || !Array.isArray(data.tasks)) {
    throw new Error("Invalid JSON format.");
  }

  state.users = data.users;
  state.tasks = data.tasks;
  state.activity = Array.isArray(data.activity) ? data.activity : [];
  state.settings = data.settings || state.settings;

  save();
}

export function resetAll() {
  Object.values(LS).forEach((k) => localStorage.removeItem(k));

  state.users = [];
  state.tasks = [];
  state.activity = [];
  state.settings = { theme: "light", view: "kanban" };

  state.charts.status?.destroy?.();
  state.charts.users?.destroy?.();
  state.charts.status = null;
  state.charts.users = null;

  state.flags.sortableInited = false;

  load(); // recreates seed
}
