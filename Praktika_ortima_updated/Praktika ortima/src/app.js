import { state } from "./store.js";
import { load, save } from "./services/persistence.js";
import { activityService } from "./services/activityService.js";
import { initUI, bindEvents, applyTheme, applyView, renderAll } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initUI();

  load();

  applyTheme(state.settings.theme || "light");
  applyView(state.settings.view || "kanban");

  renderAll(true);

  // ВАЖНО: вешаем события после того, как всё точно есть в DOM
  bindEvents();

  // Global error logging (for diagnostics)
  window.addEventListener("error", (e) => {
    try {
      activityService.log("error", `Runtime error: ${e.message}`, {
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      });
      save();
      renderAll();
    } catch (_) {
      // ignore
    }
  });

  window.addEventListener("unhandledrejection", (e) => {
    try {
      activityService.log("error", "Unhandled promise rejection", {
        reason: String(e.reason),
      });
      save();
      renderAll();
    } catch (_) {
      // ignore
    }
  });

});
