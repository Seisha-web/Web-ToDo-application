// src/store.js

export const LS = {
  USERS: "tmpro_users_v1",
  TASKS: "tmpro_tasks_v1",
  ACT: "tmpro_activity_v1",
  SET: "tmpro_settings_v1",
};

export const DATA_VERSION = 1;

export const STATUSES = ["Open", "In Progress", "Done"];
export const PRIORITIES = ["Low", "Medium", "High"];

// One mutable store object — easy to share across modules
export const store = {
  users: [],
  tasks: [],
  activity: [],
  settings: { theme: "light", view: "kanban", dataVersion: DATA_VERSION },

  // UI runtime refs
  statusChart: null,
  usersChart: null,
  taskModal: null,
  toast: null,
  sortableInited: false,
};
export const state = {
  users: [],
  tasks: [],
  activity: [],
  settings: { theme: "light", view: "kanban" },

  charts: { status: null, users: null },
  ui: { taskModal: null, toast: null },

  flags: { sortableInited: false },
};
