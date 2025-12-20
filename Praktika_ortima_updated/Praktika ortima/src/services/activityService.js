import { state } from "../store.js";
import { uid, nowISO } from "../utils.js";

export const activityService = {
  log(type, text, meta = {}) {
    const entry = {
      id: uid(),
      ts: nowISO(),
      type,
      text,
      meta,
    };
    state.activity = state.activity || [];
    state.activity.unshift(entry);
    return entry;
  },

  getAll() {
    return state.activity || [];
  },

  clear() {
    state.activity = [];
  },
};
