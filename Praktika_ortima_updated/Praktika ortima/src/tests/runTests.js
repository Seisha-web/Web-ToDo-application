import {
  asTags,
  uid,
  mkTask,
  isOverdue,
  badgePriority,
  badgeStatus,
} from "../utils.js";
import { makeTask } from "../models/taskModel.js";

const out = document.getElementById("out");

function log(line = "") {
  out.textContent += line + "\n";
}

function assert(name, condition) {
  if (!condition) throw new Error(name);
}

function test(name, fn) {
  try {
    fn();
    log(`✅ ${name}`);
    return true;
  } catch (e) {
    log(`❌ ${name}`);
    log(`   ${e?.message || e}`);
    return false;
  }
}

log("Running tests...\n");

let pass = 0;
let fail = 0;

// ---------- TESTS ----------
[
  ["asTags: trims + lowercase + removes empty", () => {
    const tags = asTags(" UI, Bug,  ,docs ");
    assert("length === 3", tags.length === 3);
    assert("ui", tags[0] === "ui");
    assert("bug", tags[1] === "bug");
    assert("docs", tags[2] === "docs");
  }],

  ["uid: returns non-empty string", () => {
    const id = uid();
    assert("string", typeof id === "string");
    assert("not empty", id.length > 5);
  }],

  ["mkTask: creates task with defaults", () => {
    const t = mkTask("Title", "Desc", "u1");
    assert("has id", !!t.id);
    assert("default status Open", t.status === "Open");
    assert("default priority Medium", t.priority === "Medium");
    assert("checklist array", Array.isArray(t.checklist));
    assert("comments array", Array.isArray(t.comments));
  }],

  ["makeTask: wraps mkTask correctly", () => {
    const t = makeTask({ title: "A", status: "Done", priority: "High", tags: ["ui"] });
    assert("title", t.title === "A");
    assert("status", t.status === "Done");
    assert("priority", t.priority === "High");
    assert("tags", t.tags?.[0] === "ui");
  }],

  ["badgePriority: maps values to bootstrap class", () => {
    assert("High", badgePriority("High").includes("danger"));
    assert("Medium", badgePriority("Medium").includes("primary"));
    assert("Low", badgePriority("Low").includes("secondary"));
  }],

  ["badgeStatus: maps values to bootstrap class", () => {
    assert("Done", badgeStatus("Done").includes("success"));
    assert("In Progress", badgeStatus("In Progress").includes("warning"));
    assert("Open", badgeStatus("Open").includes("secondary"));
  }],

  ["isOverdue: overdue when dueDate < today and not Done", () => {
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const t = { dueDate: yesterday, status: "Open" };
    assert("overdue true", isOverdue(t) === true);
  }],

  ["isOverdue: not overdue for Done", () => {
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    const t = { dueDate: yesterday, status: "Done" };
    assert("overdue false", isOverdue(t) === false);
  }],
].forEach(([name, fn]) => {
  const ok = test(name, fn);
  ok ? pass++ : fail++;
});

// ---------- SUMMARY ----------
log(`\n---`);
log(`Passed: ${pass}`);
log(`Failed: ${fail}`);

document.title = fail ? `Tests: ${fail} failed` : `Tests: all passed`;
