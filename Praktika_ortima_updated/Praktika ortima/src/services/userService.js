import { state } from "../store.js";
import { save } from "./persistence.js";
import { makeUser } from "../models/userModel.js";
import { activityService } from "./activityService.js";

export const userService = {
  addUser(name) {
    const cleaned = (name || "").trim();
    if (!cleaned) return { ok: false, message: "Name is empty." };

    const exists = state.users.some(
      (u) => u.name.toLowerCase() === cleaned.toLowerCase()
    );
    if (exists) return { ok: false, message: "This user already exists." };

    const user = makeUser(cleaned);
    state.users.push(user);

    activityService.log("user", `Added member: ${cleaned}`, { userId: user.id });
    save();
    return { ok: true, user };
  },
};
