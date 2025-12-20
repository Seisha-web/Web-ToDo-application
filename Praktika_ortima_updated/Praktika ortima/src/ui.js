import { state } from "./store.js";
import { save, exportJSON, importJSONFile, resetAll } from "./services/persistence.js";
import {
  esc,
  asTags,
  fmtDate,
  isOverdue,
  badgeStatus,
  badgePriority,
} from "./utils.js";

import { userService } from "./services/userService.js";
import { taskService } from "./services/taskService.js";
import { activityService } from "./services/activityService.js";

import {
  qSearch,
  btnNewTask,
  btnTheme,
  btnExport,
  fileImport,
  btnReset,

  userForm,
  userName,
  usersList,
  badgeUsers,

  fAssignee,
  fPriority,
  fStatus,
  fTag,
  btnClearFilters,

  badgeTasks,
  activityList,

  viewKanban,
  viewList,
  viewAnalytics,

  colOpen,
  colProgress,
  colDone,
  countOpen,
  countProgress,
  countDone,

  listTbody,

  chartStatusCanvas,
  chartUsersCanvas,
  analyticsBadges,

  taskModalEl,
  taskModalForm,
  mTaskId,
  mTitle,
  mDesc,
  mAssignee,
  mStatus,
  mPriority,
  mDue,
  mTags,

  mChecklistNew,
  btnAddChecklist,
  mChecklist,

  mCommentText,
  btnAddComment,
  mComments,

  btnDeleteTask,

  appToastEl,
  toastBody,
  toastTime,
} from "./dom.js";

// ===== Helpers =====
function userById(id) {
  return state.users.find((u) => u.id === id) || null;
}

export function toastMsg(msg) {
  toastTime.textContent = dayjs().format("HH:mm");
  toastBody.textContent = msg;
  state.ui.toast.show();
}

// ===== Filters =====
function filteredTasks() {
  const q = (qSearch.value || "").trim().toLowerCase();
  const a = fAssignee.value;
  const p = fPriority.value;
  const s = fStatus.value;
  const tag = (fTag.value || "").trim().toLowerCase();

  return state.tasks
    .filter((t) => {
      if (a !== "All" && t.assigneeId !== a) return false;
      if (p !== "All" && t.priority !== p) return false;
      if (s !== "All" && t.status !== s) return false;
      if (tag && !(t.tags || []).includes(tag)) return false;

      if (q) {
        const hay = `${t.title} ${t.description} ${(t.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
}

// ===== Render Users =====
function renderUsers() {
  badgeUsers.textContent = state.users.length.toString();

  usersList.innerHTML = "";
  for (const u of state.users) {
    const cnt = state.tasks.filter((t) => t.assigneeId === u.id).length;
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

  const currentFilter = fAssignee.value || "All";
  fAssignee.innerHTML = `<option value="All">All performers</option>`;
  mAssignee.innerHTML = "";

  for (const u of state.users) {
    const opt1 = document.createElement("option");
    opt1.value = u.id;
    opt1.textContent = u.name;
    fAssignee.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = u.id;
    opt2.textContent = u.name;
    mAssignee.appendChild(opt2);
  }

  fAssignee.value = currentFilter;
}

// ===== Kanban =====
function taskCardHTML(t) {
  const u = userById(t.assigneeId);
  const overdue = isOverdue(t);
  const tags = (t.tags || []).slice(0, 4);

  const checklist = t.checklist || [];
  const doneCount = checklist.filter((c) => c.done).length;

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
        ${tags.map((x) => `<span class="badge text-bg-light border">${esc(x)}</span>`).join("")}
      </div>

      <div class="small text-body-secondary mt-2">
        <i class="fa-solid fa-user me-1"></i>${esc(u?.name || "—")}
      </div>
    </div>
  `;
}

function wireCardClicks() {
  document.querySelectorAll(".task-card").forEach((card) => {
    card.addEventListener("click", () => openTaskModal(card.dataset.id));
  });
}

function wireSortableOnce() {
  if (state.flags.sortableInited) return;
  state.flags.sortableInited = true;

  const make = (el) =>
    new Sortable(el, {
      group: "tasks",
      animation: 140,
      ghostClass: "opacity-50",
      onEnd: () => {
        taskService.syncStatusAndOrderFromDOM({ colOpen, colProgress, colDone });
        renderAll(true);
        toastMsg("Moved successfully ✅");
      },
    });

  make(colOpen);
  make(colProgress);
  make(colDone);
}

function renderKanban() {
  const ft = filteredTasks();

  const open = ft.filter((t) => t.status === "Open");
  const prog = ft.filter((t) => t.status === "In Progress");
  const done = ft.filter((t) => t.status === "Done");

  countOpen.textContent = open.length.toString();
  countProgress.textContent = prog.length.toString();
  countDone.textContent = done.length.toString();

  colOpen.innerHTML = open.map(taskCardHTML).join("");
  colProgress.innerHTML = prog.map(taskCardHTML).join("");
  colDone.innerHTML = done.map(taskCardHTML).join("");

  wireCardClicks();
  wireSortableOnce();
}

// ===== List =====
function renderList() {
  const ft = filteredTasks();

  listTbody.innerHTML = ft
    .map((t) => {
      const u = userById(t.assigneeId);
      const overdue = isOverdue(t);

      return `
        <tr data-id="${t.id}">
          <td>
            <div class="fw-semibold">${esc(t.title)}</div>
            ${t.description ? `<div class="small text-body-secondary task-desc">${esc(t.description)}</div>` : ""}
            <div class="small text-body-secondary mt-1">
              ${t.tags?.slice(0, 4).map((x) => `<span class="badge text-bg-light border me-1">${esc(x)}</span>`).join("")}
            </div>
          </td>
          <td>${esc(u?.name || "—")}</td>
          <td><span class="badge ${badgeStatus(t.status)}">${t.status}</span></td>
          <td><span class="badge ${badgePriority(t.priority)}">${t.priority}</span></td>
          <td>
            ${
              t.dueDate
                ? `${fmtDate(t.dueDate)} ${
                    overdue ? `<span class="badge text-bg-danger ms-1">Overdue</span>` : ""
                  }`
                : "—"
            }
          </td>
          <td class="text-end">
            <button class="btn btn-outline-primary btn-sm js-edit">
              <i class="fa-solid fa-pen"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  listTbody.querySelectorAll(".js-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.closest("tr").dataset.id;
      openTaskModal(id);
    });
  });
}

// ===== Activity =====
function renderActivity() {
  activityList.innerHTML =
    state.activity
      .slice(0, 20)
      .map(
        (a) => `
        <div class="item">
          <div class="fw-semibold">${esc(a.text)}</div>
          <div class="text-body-secondary">${dayjs(a.ts).format("DD.MM HH:mm")}</div>
        </div>
      `
      )
      .join("") || `<div class="text-body-secondary">Empty for now.</div>`;
}

// ===== Analytics =====
function renderAnalytics() {
  const total = state.tasks.length;
  const open = state.tasks.filter((t) => t.status === "Open").length;
  const prog = state.tasks.filter((t) => t.status === "In Progress").length;
  const done = state.tasks.filter((t) => t.status === "Done").length;

  const overdue = state.tasks.filter(isOverdue).length;
  const dueSoon = state.tasks.filter(
    (t) => t.dueDate && dayjs(t.dueDate).diff(dayjs(), "day") <= 2 && t.status !== "Done"
  ).length;

  analyticsBadges.innerHTML = `
    <span class="badge text-bg-secondary">Total: ${total}</span>
    <span class="badge text-bg-secondary">Open: ${open}</span>
    <span class="badge text-bg-warning">In Progress: ${prog}</span>
    <span class="badge text-bg-success">Done: ${done}</span>
    <span class="badge text-bg-danger">Overdue: ${overdue}</span>
    <span class="badge text-bg-primary">Due ≤ 2 days: ${dueSoon}</span>
  `;

  const statusData = {
    labels: ["Open", "In Progress", "Done"],
    datasets: [{ label: "Tasks", data: [open, prog, done], borderWidth: 1 }],
  };

  if (!state.charts.status) {
    state.charts.status = new Chart(chartStatusCanvas, {
      type: "doughnut",
      data: statusData,
      options: { responsive: true, plugins: { legend: { position: "bottom" } } },
    });
  } else {
    state.charts.status.data = statusData;
    state.charts.status.update();
  }

  const labels = state.users.map((u) => u.name);
  const byUser = (status) =>
    state.users.map((u) => state.tasks.filter((t) => t.assigneeId === u.id && t.status === status).length);

  const usersData = {
    labels,
    datasets: [
      { label: "Open", data: byUser("Open") },
      { label: "In Progress", data: byUser("In Progress") },
      { label: "Done", data: byUser("Done") },
    ],
  };

  if (!state.charts.users) {
    state.charts.users = new Chart(chartUsersCanvas, {
      type: "bar",
      data: usersData,
      options: {
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        plugins: { legend: { position: "bottom" } },
      },
    });
  } else {
    state.charts.users.data = usersData;
    state.charts.users.update();
  }
}

// ===== Modal =====
function renderChecklist(t) {
  const list = t.checklist || [];
  mChecklist.innerHTML =
    list
      .map(
        (item) => `
      <div class="check-item" data-id="${item.id}">
        <label class="d-flex gap-2 align-items-center m-0 flex-grow-1">
          <input class="form-check-input js-check" type="checkbox" ${item.done ? "checked" : ""}>
          <span class="${item.done ? "text-decoration-line-through text-body-secondary" : ""}">${esc(item.text)}</span>
        </label>
        <button class="btn btn-outline-danger btn-sm js-delcheck" type="button" title="Delete">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `
      )
      .join("") || `<div class="text-body-secondary small">Empty for now. Add items above.</div>`;

  mChecklist.querySelectorAll(".js-check").forEach((ch) => {
    ch.addEventListener("change", (e) => {
      const itemId = e.currentTarget.closest(".check-item").dataset.id;
      const taskId = mTaskId.value;
      taskService.toggleChecklistItem(taskId, itemId, e.currentTarget.checked);

      const t = state.tasks.find((x) => x.id === taskId);
      if (t) renderChecklist(t);
      renderAll(false);
    });
  });

  mChecklist.querySelectorAll(".js-delcheck").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = e.currentTarget.closest(".check-item").dataset.id;
      const taskId = mTaskId.value;

      taskService.deleteChecklistItem(taskId, itemId);

      const t = state.tasks.find((x) => x.id === taskId);
      if (t) renderChecklist(t);
      renderAll(false);
    });
  });
}

function renderComments(t) {
  const list = t.comments || [];
  mComments.innerHTML =
    list
      .map((c) => {
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
      })
      .join("") || `<div class="text-body-secondary small">No comments yet.</div>`;
}

export function openTaskModal(taskId) {
  const t = state.tasks.find((x) => x.id === taskId);
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

  state.ui.taskModal.show();
}

export function openNewTaskModal() {
  mTaskId.value = "";
  mTitle.value = "New task";
  mDesc.value = "";
  mAssignee.value = state.users[0]?.id || "";
  mStatus.value = "Open";
  mPriority.value = "Medium";
  mDue.value = "";
  mTags.value = "";

  mChecklist.innerHTML = "";
  mComments.innerHTML = "";
  mChecklistNew.value = "";
  mCommentText.value = "";

  state.ui.taskModal.show();
}

// ===== Theme / View =====
export function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  state.settings.theme = theme;
  save();
}

export function applyView(view) {
  state.settings.view = view;
  save();

  viewKanban.classList.toggle("d-none", view !== "kanban");
  viewList.classList.toggle("d-none", view !== "list");
  viewAnalytics.classList.toggle("d-none", view !== "analytics");

  document.querySelectorAll("#viewTabs .nav-link").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
  });

  if (view === "analytics") renderAnalytics();
}

// ===== Render All =====
export function renderAll(withCharts = true) {
  renderUsers();

  const ft = filteredTasks();
  badgeTasks.textContent = ft.length.toString();

  renderKanban();
  renderList();
  renderActivity();

  if (withCharts && state.settings.view === "analytics") renderAnalytics();
}

// ===== Init + Events =====
export function initUI() {
  state.ui.taskModal = new bootstrap.Modal(taskModalEl);
  state.ui.toast = new bootstrap.Toast(appToastEl, { delay: 2200 });
}

export function bindEvents() {
  // Add user
  userForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = userService.addUser(userName.value);

    if (!res.ok) {
      activityService.log("warn", res.message || "Failed to add user.", { name: userName.value });
      toastMsg(res.message || "Failed to add user.");
      return;
    }

    userName.value = "";
    renderAll(true);
  });

  // Filters
  [qSearch, fAssignee, fPriority, fStatus, fTag].forEach((el) => {
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
      taskService.createTask(data);
      toastMsg("Task created ✅");
    } else {
      const res = taskService.updateTask(id, data);
      if (!res.ok) {
        toastMsg(res.message || "Failed to update task.");
        return;
      }
      toastMsg("Saved ✅");
    }

    state.ui.taskModal.hide();
    renderAll(true);
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

    const res = taskService.addChecklistItem(id, text);
    if (!res.ok) {
      toastMsg(res.message || "Failed to add checklist item.");
      return;
    }

    mChecklistNew.value = "";
    renderChecklist(res.task);
    renderAll(false);
  });

  // comment add
  btnAddComment.addEventListener("click", () => {
    const text = (mCommentText.value || "").trim();
    if (!text) return;

    const id = mTaskId.value;
    if (!id) {
      toastMsg("Save the task first, then comment 🙂");
      return;
    }

    const res = taskService.addComment(id, text);
    if (!res.ok) {
      toastMsg(res.message || "Failed to add comment.");
      return;
    }

    mCommentText.value = "";
    renderComments(res.task);
    renderAll(false);
  });

  // delete task
  btnDeleteTask.addEventListener("click", () => {
    const id = mTaskId.value;
    if (!id) {
      state.ui.taskModal.hide();
      return;
    }

    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;

    if (!confirm(`Delete task "${t.title}"?`)) return;

    const res = taskService.deleteTask(id);
    if (!res.ok) {
      toastMsg(res.message || "Failed to delete task.");
      return;
    }

    state.ui.taskModal.hide();
    renderAll(true);
    toastMsg("Deleted 🗑️");
  });

  // theme toggle
  btnTheme.addEventListener("click", () => {
    const theme =
      document.documentElement.getAttribute("data-bs-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(theme);
    toastMsg(theme === "dark" ? "Dark theme 🌙" : "Light theme ☀️");
  });

  // tabs view
  document.querySelectorAll("#viewTabs .nav-link").forEach((b) => {
    b.addEventListener("click", () => applyView(b.dataset.view));
  });

  // keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      qSearch.focus();
      return;
    }

    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = ["input", "textarea", "select"].includes(tag);
    if (!typing && e.key.toLowerCase() === "n") {
      e.preventDefault();
      openNewTaskModal();
    }
  });

  // export/import/reset
  btnExport.addEventListener("click", () => {
    exportJSON();
    toastMsg("Export ready ✅");
  });

  fileImport.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importJSONFile(file);
      applyTheme(state.settings.theme || "light");
      applyView(state.settings.view || "kanban");
      renderAll(true);
      toastMsg("Imported successfully ✅");
    } catch (err) {
      toastMsg(err?.message || "Failed to import file.");
    } finally {
      fileImport.value = "";
    }
  });

  btnReset.addEventListener("click", () => {
    if (!confirm("Reset everything? This will clear LocalStorage.")) return;

    resetAll();
    applyTheme(state.settings.theme || "light");
    applyView(state.settings.view || "kanban");
    renderAll(true);
    toastMsg("Reset completed.");
  });
}
