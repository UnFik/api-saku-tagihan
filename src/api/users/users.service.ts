import { eq } from "drizzle-orm";
import { unauthorized, unprocessable } from "../../common/utils";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { UserInsert } from "./users.schema";
import type { UserSiakad } from "../../types";
import { compare } from "bcrypt";
// ignore ts-line
import { env } from "bun";

export abstract class UserService {
  static async authenticate(username: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (user) {
      const match = await compare(password, user.password);
      if (match) {
        return user;
      }
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await fetch(`${env.SIAKAD_API_URL}/as400/signin/`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data: UserSiakad = await response.json();

      if (!data.status) {
        throw unprocessable(data.msg.slice(8));
      }

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user) throw unauthorized();

      const isMatch = await Bun.password.verify(password, user.password);
      if (!isMatch) throw unauthorized();

      return user;
    } catch (error: unknown) {
      throw unprocessable(error);
    }
  }

  static find(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  static update(id: string, data: Partial<UserInsert>) {
    try {
      return db.update(users).set(data).where(eq(users.id, id));
    } catch (e) {
      throw unprocessable(e);
    }
  }

  static findByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }
}
