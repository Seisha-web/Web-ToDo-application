import { uid, nowISO } from "../utils.js";

export function makeUser(name) {
  return {
    id: uid(),
    name: (name || "").trim(),
    createdAt: nowISO(),
  };
}
