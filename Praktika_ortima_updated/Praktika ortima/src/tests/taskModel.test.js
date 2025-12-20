// src/tests/taskModel.test.js
import { test, expect } from "./testkit.js";
import { makeTask } from "../models/taskModel.js";

test("makeTask: creates task with defaults", () => {
  const t = makeTask({ title: "Hello", assigneeId: "u1" });
  expect(!!t.id).toBeTruthy();
  expect(t.title).toBe("Hello");
  expect(t.assigneeId).toBe("u1");
  expect(t.status).toBe("Open");
  expect(t.priority).toBe("Medium");
  expect(Array.isArray(t.tags)).toBeTruthy();
  expect(Array.isArray(t.checklist)).toBeTruthy();
  expect(Array.isArray(t.comments)).toBeTruthy();
});
