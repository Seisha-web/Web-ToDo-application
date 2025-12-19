// ====== Keys ======
const LS = {
  USERS: "tmpro_users_v1",
  TASKS: "tmpro_tasks_v1",
  ACT:   "tmpro_activity_v1",
  SET:   "tmpro_settings_v1",
};

// ====== Const ======
const STATUSES = ["Open", "In Progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

// ====== State ======
let users = [];
let tasks = [];
let activity = [];
let settings = { theme: "light", view: "kanban" };

let statusChart = null;
let usersChart = null;

let taskModal = null;
let toast = null;

// ====== DOM ======
const $ = (id) => document.getElementById(id);

const qSearch = $("qSearch");
const btnNewTask = $("btnNewTask");
const btnTheme = $("btnTheme");
const btnExport = $("btnExport");
const fileImport = $("fileImport");
const btnReset = $("btnReset");

const userForm = $("userForm");
const userName = $("userName");
const usersList = $("usersList");
const badgeUsers = $("badgeUsers");

const fAssignee = $("fAssignee");
const fPriority = $("fPriority");
const fStatus = $("fStatus");
const fTag = $("fTag");
const btnClearFilters = $("btnClearFilters");

const badgeTasks = $("badgeTasks");
const activityList = $("activityList");

const viewTabs = $("viewTabs");
const viewKanban = $("viewKanban");
const viewList = $("viewList");
const viewAnalytics = $("viewAnalytics");

const colOpen = $("colOpen");
const colProgress = $("colProgress");
const colDone = $("colDone");
const countOpen = $("countOpen");
const countProgress = $("countProgress");
const countDone = $("countDone");

const listTbody = $("listTbody");

const chartStatusCanvas = $("chartStatus");
const chartUsersCanvas = $("chartUsers");
const analyticsBadges = $("analyticsBadges");

// Modal DOM
const taskModalEl = $("taskModal");
const taskModalForm = $("taskModalForm");
const mTaskId = $("mTaskId");
const mTitle = $("mTitle");
const mDesc = $("mDesc");
const mAssignee = $("mAssignee");
const mStatus = $("mStatus");
const mPriority = $("mPriority");
const mDue = $("mDue");
const mTags = $("mTags");

const mChecklistNew = $("mChecklistNew");
const btnAddChecklist = $("btnAddChecklist");
const mChecklist = $("mChecklist");

const mCommentText = $("mCommentText");
const btnAddComment = $("btnAddComment");
const mComments = $("mComments");

const btnDeleteTask = $("btnDeleteTask");

// Toast
const appToastEl = $("appToast");
const toastBody = $("toastBody");
const toastTime = $("toastTime");

// ====== Utils ======
function uid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function nowISO() { return new Date().toISOString(); }

function esc(str) {
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asTags(str) {
  return (str ?? "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function fmtDate(d) {
  if (!d) return "";
  // English-friendly format (still compact)
  return dayjs(d).format("DD MMM YYYY");
}

function isOverdue(t) {
  if (!t.dueDate) return false;
  return dayjs(t.dueDate).endOf("day").isBefore(dayjs()) && t.status !== "Done";
}

function badgeStatus(s) {
  if (s === "Done") return "text-bg-success";
  if (s === "In Progress") return "text-bg-warning";
  return "text-bg-secondary";
}

function badgePriority(p) {
  if (p === "High") return "text-bg-danger";
  if (p === "Medium") return "text-bg-primary";
  return "text-bg-secondary";
}

function userById(id) { return users.find(u => u.id === id) || null; }

function toastMsg(msg) {
  toastTime.textContent = dayjs().format("HH:mm");
  toastBody.textContent = msg;
  toast.show();
}

function logAct(type, text, meta = {}) {
  activity.unshift({
    id: uid(),
    ts: nowISO(),
    type,
    text,
    meta
  });
  activity = activity.slice(0, 40);
  save();
  renderActivity();
}

function save() {
  localStorage.setItem(LS.USERS, JSON.stringify(users));
  localStorage.setItem(LS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(LS.ACT, JSON.stringify(activity));
  localStorage.setItem(LS.SET, JSON.stringify(settings));
}

function load() {
  try {
    users = JSON.parse(localStorage.getItem(LS.USERS) || "[]");
    tasks = JSON.parse(localStorage.getItem(LS.TASKS) || "[]");
    activity = JSON.parse(localStorage.getItem(LS.ACT) || "[]");
    settings = JSON.parse(localStorage.getItem(LS.SET) || '{"theme":"light","view":"kanban"}');
  } catch {
    users = []; tasks = []; activity = []; settings = { theme:"light", view:"kanban" };
  }

  // Seed
  if (!users.length) {
    users = [
      { id: uid(), name: "Seisha", createdAt: nowISO() },
      { id: uid(), name: "Alex", createdAt: nowISO() },
      { id: uid(), name: "Mira", createdAt: nowISO() },
    ];
  }
  if (!tasks.length) {
    tasks = [
      mkTask("Make Kanban with drag & drop", "Drag tasks between statuses.", users[0].id, "In Progress", "High", plusDays(2), ["ui","dnd"]),
      mkTask("Add comments and a checklist", "So the task feels like Jira-lite.", users[1].id, "Open", "Medium", plusDays(4), ["feature"]),
      mkTask("Collect mini-analytics", "Chart.js: statuses + workload by assignee.", users[2].id, "Open", "Low", "", ["charts"]),
    ];
    activity = [
      { id: uid(), ts: nowISO(), type: "seed", text: "Demo users and tasks were created.", meta: {} }
    ];
  }

  applyTheme(settings.theme || "light");
  applyView(settings.view || "kanban");
  save();
}

function plusDays(n) {
  return dayjs().add(n, "day").format("YYYY-MM-DD");
}

function mkTask(title, description, assigneeId, status="Open", priority="Medium", dueDate="", tags=[]) {
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
    order: Date.now() + Math.random()
  };
}

// ====== Filters ======
function filteredTasks() {
  const q = (qSearch.value || "").trim().toLowerCase();
  const a = fAssignee.value;
  const p = fPriority.value;
  const s = fStatus.value;
  const tag = (fTag.value || "").trim().toLowerCase();

  return tasks
    .filter(t => {
      if (a !== "All" && t.assigneeId !== a) return false;
      if (p !== "All" && t.priority !== p) return false;
      if (s !== "All" && t.status !== s) return false;
      if (tag && !(t.tags || []).includes(tag)) return false;

      if (q) {
        const hay = `${t.title} ${t.description} ${(t.tags||[]).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((x,y) => (x.order ?? 0) - (y.order ?? 0));
}

// ====== Render Users ======
function renderUsers() {
  badgeUsers.textContent = users.length.toString();

  // sidebar list
  usersList.innerHTML = "";
  for (const u of users) {
    const cnt = tasks.filter(t => t.assigneeId === u.id).length;
    const div = document.createElement("div");
    div.className = "user-chip";
    div.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="fa-solid fa-user text-body-secondary"></i>
        <div class="fw-semibold">${esc(u.name)}</div>
      </div>
      <span class="badge text-bg-secondary">${cnt}</span>
    `;
    usersList.appendChild(div);
  }

  // filters + modal assignee
  const currentFilter = fAssignee.value || "All";
  fAssignee.innerHTML = `<option value="All">All assignees</option>`;
  mAssignee.innerHTML = "";

  for (const u of users) {
    const opt1 = document.createElement("option");
    opt1.value = u.id; opt1.textContent = u.name;
    fAssignee.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = u.id; opt2.textContent = u.name;
    mAssignee.appendChild(opt2);
  }
  fAssignee.value = currentFilter;
}

// ====== Render Kanban ======
function taskCardHTML(t) {
  const u = userById(t.assigneeId);
  const overdue = isOverdue(t);
  const tags = (t.tags || []).slice(0, 4);

  const checklist = t.checklist || [];
  const doneCount = checklist.filter(c => c.done).length;

  return `
    <div class="task-card" data-id="${t.id}">
      <div class="d-flex align-items-start justify-content-between gap-2">
        <div class="fw-semibold">${esc(t.title)}</div>
        <div class="d-flex gap-2">
          <span class="badge ${badgePriority(t.priority)}">${t.priority}</span>
        </div>
      </div>

      ${t.description ? `<div class="small text-body-secondary task-desc mt-1">${esc(t.description)}</div>` : ""}

      <div class="d-flex flex-wrap gap-1 mt-2">
        <span class="badge ${badgeStatus(t.status)}">${t.status}</span>
        ${t.dueDate ? `<span class="badge text-bg-secondary"><i class="fa-regular fa-calendar me-1"></i>${fmtDate(t.dueDate)}</span>` : ""}
        ${overdue ? `<span class="badge text-bg-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i>Overdue</span>` : ""}
        ${checklist.length ? `<span class="badge text-bg-secondary"><i class="fa-solid fa-list-check me-1"></i>${doneCount}/${checklist.length}</span>` : ""}
        ${t.comments?.length ? `<span class="badge text-bg-secondary"><i class="fa-regular fa-comment me-1"></i>${t.comments.length}</span>` : ""}
      </div>

      <div class="d-flex flex-wrap gap-1 mt-2">
        ${tags.map(x => `<span class="badge text-bg-light border">${esc(x)}</span>`).join("")}
      </div>

      <div class="small text-body-secondary mt-2">
        <i class="fa-solid fa-user me-1"></i>${esc(u?.name || "—")}
      </div>
    </div>
  `;
}

function renderKanban() {
  const ft = filteredTasks();

  const open = ft.filter(t => t.status === "Open");
  const prog = ft.filter(t => t.status === "In Progress");
  const done = ft.filter(t => t.status === "Done");

  countOpen.textContent = open.length.toString();
  countProgress.textContent = prog.length.toString();
  countDone.textContent = done.length.toString();

  colOpen.innerHTML = open.map(taskCardHTML).join("");
  colProgress.innerHTML = prog.map(taskCardHTML).join("");
  colDone.innerHTML = done.map(taskCardHTML).join("");

  wireCardClicks();
  wireSortable();
}

// ====== Sortable ======
let sortableInited = false;

function wireSortable() {
  if (sortableInited) return;
  sortableInited = true;

  const make = (el) => new Sortable(el, {
    group: "tasks",
    animation: 140,
    ghostClass: "opacity-50",
    onEnd: () => {
      // after drop update status by container and order by DOM
      syncStatusAndOrderFromDOM();
      save();
      renderAll();
      toastMsg("Moved successfully ✅");
    }
  });

  make(colOpen);
  make(colProgress);
  make(colDone);
}

function syncStatusAndOrderFromDOM() {
  const apply = (container, status) => {
    const cards = [...container.querySelectorAll(".task-card")];
    cards.forEach((card, idx) => {
      const id = card.dataset.id;
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      const prev = t.status;

      t.status = status;
      t.order = idx + (status === "Open" ? 0 : status === "In Progress" ? 10000 : 20000);
      t.updatedAt = nowISO();

      if (prev !== status) {
        logAct("move", `Task "${t.title}" moved to "${status}".`, { taskId: t.id, from: prev, to: status });
      }
    });
  };

  apply(colOpen, "Open");
  apply(colProgress, "In Progress");
  apply(colDone, "Done");
}

// ====== List View ======
function renderList() {
  const ft = filteredTasks();
  listTbody.innerHTML = ft.map(t => {
    const u = userById(t.assigneeId);
    const overdue = isOverdue(t);
    return `
      <tr data-id="${t.id}">
        <td>
          <div class="fw-semibold">${esc(t.title)}</div>
          ${t.description ? `<div class="small text-body-secondary task-desc">${esc(t.description)}</div>` : ""}
          <div class="small text-body-secondary mt-1">
            ${t.tags?.slice(0,4).map(x => `<span class="badge text-bg-light border me-1">${esc(x)}</span>`).join("")}
          </div>
        </td>
        <td>${esc(u?.name || "—")}</td>
        <td><span class="badge ${badgeStatus(t.status)}">${t.status}</span></td>
        <td><span class="badge ${badgePriority(t.priority)}">${t.priority}</span></td>
        <td>
          ${t.dueDate ? `${fmtDate(t.dueDate)} ${overdue ? `<span class="badge text-bg-danger ms-1">Overdue</span>` : ""}` : "—"}
        </td>
        <td class="text-end">
          <button class="btn btn-outline-primary btn-sm js-edit" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  listTbody.querySelectorAll(".js-edit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest("tr").dataset.id;
      openTaskModal(id);
    });
  });
}

// ====== Activity ======
function renderActivity() {
  activityList.innerHTML = activity.slice(0, 20).map(a => `
    <div class="item">
      <div class="fw-semibold">${esc(a.text)}</div>
      <div class="text-body-secondary">${dayjs(a.ts).format("DD.MM HH:mm")}</div>
    </div>
  `).join("") || `<div class="text-body-secondary">Nothing here yet.</div>`;
}

// ====== Analytics ======
function renderAnalytics() {
  const total = tasks.length;
  const open = tasks.filter(t => t.status === "Open").length;
  const prog = tasks.filter(t => t.status === "In Progress").length;
  const done = tasks.filter(t => t.status === "Done").length;

  // Badges
  const overdue = tasks.filter(isOverdue).length;
  const dueSoon = tasks.filter(t => t.dueDate && dayjs(t.dueDate).diff(dayjs(), "day") <= 2 && t.status !== "Done").length;

  analyticsBadges.innerHTML = `
    <span class="badge text-bg-secondary">Total: ${total}</span>
    <span class="badge text-bg-secondary">Open: ${open}</span>
    <span class="badge text-bg-warning">In Progress: ${prog}</span>
    <span class="badge text-bg-success">Done: ${done}</span>
    <span class="badge text-bg-danger">Overdue: ${overdue}</span>
    <span class="badge text-bg-primary">Due ≤ 2 days: ${dueSoon}</span>
  `;

  // Chart: Status (doughnut)
  const statusData = {
    labels: ["Open", "In Progress", "Done"],
    datasets: [{ label: "Tasks", data: [open, prog, done], borderWidth: 1 }]
  };

  if (!statusChart) {
    statusChart = new Chart(chartStatusCanvas, {
      type: "doughnut",
      data: statusData,
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  } else {
    statusChart.data = statusData;
    statusChart.update();
  }

  // Chart: per user stacked
  const labels = users.map(u => u.name);
  const byUser = (status) => users.map(u => tasks.filter(t => t.assigneeId === u.id && t.status === status).length);

  const usersData = {
    labels,
    datasets: [
      { label: "Open", data: byUser("Open") },
      { label: "In Progress", data: byUser("In Progress") },
      { label: "Done", data: byUser("Done") },
    ]
  };

  if (!usersChart) {
    usersChart = new Chart(chartUsersCanvas, {
      type: "bar",
      data: usersData,
      options: {
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        plugins: { legend: { position: "bottom" } }
      }
    });
  } else {
    usersChart.data = usersData;
    usersChart.update();
  }
}

// ====== Modal ======
function openTaskModal(taskId) {
  const t = tasks.find(x => x.id === taskId);
  if (!t) return;

  mTaskId.value = t.id;
  mTitle.value = t.title;
  mDesc.value = t.description || "";
  mAssignee.value = t.assigneeId;
  mStatus.value = t.status;
  mPriority.value = t.priority;
  mDue.value = t.dueDate || "";
  mTags.value = (t.tags || []).join(", ");

  renderChecklist(t);
  renderComments(t);

  taskModal.show();
}

function openNewTaskModal() {
  const t = mkTask("New Task", "", users[0]?.id || "", "Open", "Medium", "", []);
  // Do not add to the array until the user hits Save
  mTaskId.value = "";
  mTitle.value = t.title;
  mDesc.value = t.description;
  mAssignee.value = t.assigneeId;
  mStatus.value = t.status;
  mPriority.value = t.priority;
  mDue.value = "";
  mTags.value = "";

  mChecklist.innerHTML = "";
  mComments.innerHTML = "";
  mChecklistNew.value = "";
  mCommentText.value = "";

  taskModal.show();
}

function renderChecklist(t) {
  const list = t.checklist || [];
  mChecklist.innerHTML = list.map(item => `
    <div class="check-item" data-id="${item.id}">
      <label class="d-flex gap-2 align-items-center m-0 flex-grow-1">
        <input class="form-check-input js-check" type="checkbox" ${item.done ? "checked" : ""}>
        <span class="${item.done ? "text-decoration-line-through text-body-secondary" : ""}">${esc(item.text)}</span>
      </label>
      <button class="btn btn-outline-danger btn-sm js-delcheck" type="button" title="Delete">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join("") || `<div class="text-body-secondary small">Nothing here yet. Add items above.</div>`;

  mChecklist.querySelectorAll(".js-check").forEach(ch => {
    ch.addEventListener("change", (e) => {
      const id = e.currentTarget.closest(".check-item").dataset.id;
      const item = (t.checklist || []).find(x => x.id === id);
      if (!item) return;
      item.done = e.currentTarget.checked;
      t.updatedAt = nowISO();
      save();
      renderChecklist(t);
      renderAll(false);
    });
  });

  mChecklist.querySelectorAll(".js-delcheck").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest(".check-item").dataset.id;
      t.checklist = (t.checklist || []).filter(x => x.id !== id);
      t.updatedAt = nowISO();
      logAct("check", `Checklist updated in "${t.title}".`, { taskId: t.id });
      save();
      renderChecklist(t);
      renderAll(false);
    });
  });
}

function renderComments(t) {
  const list = t.comments || [];
  mComments.innerHTML = list.map(c => {
    const u = userById(c.authorId);
    return `
      <div class="comment-item">
        <div class="d-flex align-items-center justify-content-between">
          <div class="fw-semibold"><i class="fa-solid fa-user me-1"></i>${esc(u?.name || "—")}</div>
          <div class="small text-body-secondary">${dayjs(c.ts).format("DD.MM HH:mm")}</div>
        </div>
        <div class="mt-2">${esc(c.text)}</div>
      </div>
    `;
  }).join("") || `<div class="text-body-secondary small">No comments yet.</div>`;
}

// ====== Theme / View ======
function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute("data-bs-theme", theme);
  settings.theme = theme;
  save();
}

function applyView(view) {
  settings.view = view;
  save();

  viewKanban.classList.toggle("d-none", view !== "kanban");
  viewList.classList.toggle("d-none", view !== "list");
  viewAnalytics.classList.toggle("d-none", view !== "analytics");

  // tabs
  document.querySelectorAll("#viewTabs .nav-link").forEach(b => {
    b.classList.toggle("active", b.dataset.view === view);
  });

  if (view === "analytics") renderAnalytics();
}

// ====== Render All ======
function renderAll(withCharts = true) {
  renderUsers();

  const ft = filteredTasks();
  badgeTasks.textContent = ft.length.toString();

  renderKanban();
  renderList();

  renderActivity();

  if (withCharts && settings.view === "analytics") renderAnalytics();
}

// ====== Events ======
// Add user
userForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = (userName.value || "").trim();
  if (!name) return;

  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
    toastMsg("That team member already exists.");
    return;
  }

  users.push({ id: uid(), name, createdAt: nowISO() });
  userName.value = "";
  logAct("user", `Added team member: ${name}`, {});
  save();
  renderAll();
});

// Filters
[qSearch, fAssignee, fPriority, fStatus, fTag].forEach(el => {
  el.addEventListener("input", () => renderAll(false));
  el.addEventListener("change", () => renderAll(false));
});

btnClearFilters.addEventListener("click", () => {
  qSearch.value = "";
  fAssignee.value = "All";
  fPriority.value = "All";
  fStatus.value = "All";
  fTag.value = "";
  renderAll(false);
});

// Card click
function wireCardClicks() {
  document.querySelectorAll(".task-card").forEach(card => {
    card.addEventListener("click", () => openTaskModal(card.dataset.id));
  });
}

// Modal create/edit
taskModalForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = (mTitle.value || "").trim();
  if (!title) return;

  const id = mTaskId.value;
  const data = {
    title,
    description: (mDesc.value || "").trim(),
    assigneeId: mAssignee.value,
    status: mStatus.value,
    priority: mPriority.value,
    dueDate: mDue.value || "",
    tags: asTags(mTags.value),
  };

  if (!id) {
    const t = mkTask(data.title, data.description, data.assigneeId, data.status, data.priority, data.dueDate, data.tags);
    tasks.unshift(t);
    logAct("create", `Created task "${t.title}".`, { taskId: t.id });
    toastMsg("Task created ✅");
  } else {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    const before = { status: t.status, assigneeId: t.assigneeId, priority: t.priority, dueDate: t.dueDate };

    Object.assign(t, data, { updatedAt: nowISO() });

    // quick logs
    if (before.status !== t.status) logAct("status", `Status changed: "${t.title}" (${before.status} → ${t.status})`, { taskId: t.id });
    if (before.assigneeId !== t.assigneeId) logAct("assignee", `Reassigned "${t.title}".`, { taskId: t.id });
    if (before.priority !== t.priority) logAct("prio", `Priority changed: "${t.title}" (${before.priority} → ${t.priority})`, { taskId: t.id });
    if (before.dueDate !== t.dueDate) logAct("due", `Deadline updated: "${t.title}".`, { taskId: t.id });

    toastMsg("Saved ✅");
  }

  save();
  taskModal.hide();
  renderAll();
});

btnNewTask.addEventListener("click", openNewTaskModal);

// checklist add
btnAddChecklist.addEventListener("click", () => {
  const text = (mChecklistNew.value || "").trim();
  if (!text) return;

  const id = mTaskId.value;
  if (!id) {
    toastMsg("Save the task first, then add checklist items 🙂");
    return;
  }
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  t.checklist = t.checklist || [];
  t.checklist.push({ id: uid(), text, done: false });
  t.updatedAt = nowISO();

  mChecklistNew.value = "";
  logAct("check", `Added checklist item to "${t.title}".`, { taskId: t.id });
  save();
  renderChecklist(t);
  renderAll(false);
});

// comment add
btnAddComment.addEventListener("click", () => {
  const text = (mCommentText.value || "").trim();
  if (!text) return;

  const id = mTaskId.value;
  if (!id) {
    toastMsg("Save the task first, then add a comment 🙂");
    return;
  }
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  t.comments = t.comments || [];
  t.comments.push({ id: uid(), authorId: t.assigneeId, text, ts: nowISO() });
  t.updatedAt = nowISO();

  mCommentText.value = "";
  logAct("comment", `Comment added to "${t.title}".`, { taskId: t.id });
  save();
  renderComments(t);
  renderAll(false);
});

// delete task
btnDeleteTask.addEventListener("click", () => {
  const id = mTaskId.value;
  if (!id) { taskModal.hide(); return; }

  const t = tasks.find(x => x.id === id);
  if (!t) return;

  if (!confirm(`Delete task "${t.title}"? This action can’t be undone.`)) return;

  tasks = tasks.filter(x => x.id !== id);
  logAct("delete", `Deleted task "${t.title}".`, { taskId: id });
  save();
  taskModal.hide();
  renderAll();
  toastMsg("Deleted 🗑️");
});

// theme toggle
btnTheme.addEventListener("click", () => {
  const theme = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
  applyTheme(theme);
  toastMsg(theme === "dark" ? "Dark theme 🌙" : "Light theme ☀️");
});

// tabs view
document.querySelectorAll("#viewTabs .nav-link").forEach(b => {
  b.addEventListener("click", () => applyView(b.dataset.view));
});

// keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl+K: focus search
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    qSearch.focus();
    return;
  }
  // N: new task (only if not typing inside an input)
  const tag = (document.activeElement?.tagName || "").toLowerCase();
  const typing = ["input", "textarea", "select"].includes(tag);
  if (!typing && e.key.toLowerCase() === "n") {
    e.preventDefault();
    openNewTaskModal();
  }
});

// export/import/reset
btnExport.addEventListener("click", () => {
  const payload = { users, tasks, activity, settings, exportedAt: nowISO(), version: 1 };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "task-manager-pro-export.json";
  a.click();
  URL.revokeObjectURL(url);
  toastMsg("Export ready ✅");
});

fileImport.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data.users) || !Array.isArray(data.tasks)) {
      toastMsg("Invalid JSON format.");
      return;
    }

    users = data.users;
    tasks = data.tasks;
    activity = Array.isArray(data.activity) ? data.activity : [];
    settings = data.settings || settings;

    save();
    applyTheme(settings.theme || "light");
    applyView(settings.view || "kanban");
    renderAll();
    toastMsg("Imported successfully ✅");
  } catch {
    toastMsg("Failed to import the file.");
  } finally {
    fileImport.value = "";
  }
});

btnReset.addEventListener("click", () => {
  if (!confirm("Reset everything? This will remove all app data from LocalStorage.")) return;

  Object.values(LS).forEach(k => localStorage.removeItem(k));
  users = []; tasks = []; activity = []; settings = { theme:"light", view:"kanban" };

  statusChart?.destroy?.(); usersChart?.destroy?.();
  statusChart = null; usersChart = null;

  sortableInited = false;

  load();
  renderAll();
  toastMsg("Reset completed ✅");
});

// ====== Boot ======
function initUI() {
  taskModal = new bootstrap.Modal(taskModalEl);
  toast = new bootstrap.Toast(appToastEl, { delay: 2200 });
}

initUI();
load();
renderAll();
applyView(settings.view || "kanban");
