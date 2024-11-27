import type { User } from "./users.schema";

export function formattedUser(user: User) {
  const { name, username, role, } = user;
  return { name, username, role };
}