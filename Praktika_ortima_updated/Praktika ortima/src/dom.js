// src/dom.js

export const $ = (id) => document.getElementById(id);

// Top bar
export const qSearch = $("qSearch");
export const btnNewTask = $("btnNewTask");
export const btnTheme = $("btnTheme");
export const btnExport = $("btnExport");
export const fileImport = $("fileImport");
export const btnReset = $("btnReset");

// Users
export const userForm = $("userForm");
export const userName = $("userName");
export const usersList = $("usersList");
export const badgeUsers = $("badgeUsers");

// Filters
export const fAssignee = $("fAssignee");
export const fPriority = $("fPriority");
export const fStatus = $("fStatus");
export const fTag = $("fTag");
export const btnClearFilters = $("btnClearFilters");

// Main
export const badgeTasks = $("badgeTasks");
export const activityList = $("activityList");

export const viewTabs = $("viewTabs");
export const viewKanban = $("viewKanban");
export const viewList = $("viewList");
export const viewAnalytics = $("viewAnalytics");

// Kanban columns
export const colOpen = $("colOpen");
export const colProgress = $("colProgress");
export const colDone = $("colDone");
export const countOpen = $("countOpen");
export const countProgress = $("countProgress");
export const countDone = $("countDone");

// List table
export const listTbody = $("listTbody");

// Analytics
export const chartStatusCanvas = $("chartStatus");
export const chartUsersCanvas = $("chartUsers");
export const analyticsBadges = $("analyticsBadges");

// Modal
export const taskModalEl = $("taskModal");
export const taskModalForm = $("taskModalForm");
export const mTaskId = $("mTaskId");
export const mTitle = $("mTitle");
export const mDesc = $("mDesc");
export const mAssignee = $("mAssignee");
export const mStatus = $("mStatus");
export const mPriority = $("mPriority");
export const mDue = $("mDue");
export const mTags = $("mTags");

export const mChecklistNew = $("mChecklistNew");
export const btnAddChecklist = $("btnAddChecklist");
export const mChecklist = $("mChecklist");

export const mCommentText = $("mCommentText");
export const btnAddComment = $("btnAddComment");
export const mComments = $("mComments");

export const btnDeleteTask = $("btnDeleteTask");

// Toast
export const appToastEl = $("appToast");
export const toastBody = $("toastBody");
export const toastTime = $("toastTime");
