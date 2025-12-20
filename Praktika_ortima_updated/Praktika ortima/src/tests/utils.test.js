// src/tests/utils.test.js
import { test, expect } from "./testkit.js";
import { asTags, esc } from "../utils.js";

test("asTags: trims, lowercases, splits by comma", () => {
  const t = asTags(" UI, Bug, docs ");
  expect(t).toEqual(["ui", "bug", "docs"]);
});

test("asTags: removes empty chunks", () => {
  const t = asTags("a, , ,b,  ,c");
  expect(t).toEqual(["a", "b", "c"]);
});

test("asTags: limits to 12 tags", () => {
  const many = Array.from({ length: 20 }, (_, i) => `t${i}`).join(",");
  const t = asTags(many);
  expect(t.length).toBe(12);
});

test("esc: escapes html special chars", () => {
  const s = `<script>alert("x")</script>`;
  const out = esc(s);
  expect(out.includes("<")).toBeFalsy();
  expect(out.includes(">")).toBeFalsy();
  expect(out.includes("&lt;script&gt;")).toBeTruthy();
});
