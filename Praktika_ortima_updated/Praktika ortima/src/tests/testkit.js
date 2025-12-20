// src/tests/testkit.js
const results = [];

export function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err });
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected ${a} to equal ${b}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected value to be truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected value to be falsy, got ${JSON.stringify(actual)}`);
    },
    toThrow() {
      if (typeof actual !== "function") throw new Error(`toThrow expects a function`);
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) throw new Error(`Expected function to throw, but it did not`);
    },
  };
}

export function renderResults(rootEl) {
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = total - passed;

  rootEl.innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 16px;">
      <h2 style="margin: 0 0 8px;">Task Manager Pro — Tests</h2>
      <div style="margin-bottom: 12px;">
        <strong>Total:</strong> ${total} |
        <strong style="color: #16803c;">Passed:</strong> ${passed} |
        <strong style="color: #b42318;">Failed:</strong> ${failed}
      </div>
      <div>
        ${results.map(r => `
          <div style="padding: 10px 12px; margin: 8px 0; border-radius: 10px; border: 1px solid #ddd; background: ${r.ok ? "#ecfdf3" : "#fef3f2"};">
            <div style="font-weight: 700; color: ${r.ok ? "#16803c" : "#b42318"};">
              ${r.ok ? "PASS" : "FAIL"} — ${escapeHtml(r.name)}
            </div>
            ${r.ok ? "" : `<pre style="margin: 8px 0 0; white-space: pre-wrap;">${escapeHtml(String(r.error?.stack || r.error))}</pre>`}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return (s ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
