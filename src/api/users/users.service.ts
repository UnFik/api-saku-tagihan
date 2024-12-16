import { eq } from "drizzle-orm";
import { unauthorized, unprocessable, invalid } from "../../common/utils";
import { db } from "../../db";
import { users } from "../../db/schema";
import type { UserInsert, AuthSiakad } from "./users.schema";
import { compare } from "bcrypt";
import * as Sentry from "@sentry/bun";
// ignore ts-line
import { env } from "bun";
import { ElysiaCustomStatusResponse } from "elysia/dist/error";

export abstract class UserService {
  static async authenticate(username: string, password: string) {
    let user = await db.query.users.findFirst({
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

    const response = await fetch(`${env.SIAKAD_API_URL}/as400/signin/`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data: AuthSiakad = await response.json();

    if (!data.status) {
      throw invalid(data.msg.slice(8));
    }

    user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) throw unauthorized();

    const isMatch = await Bun.password.verify(password, user.password);
    if (!isMatch) throw unauthorized();
    return user;
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
      Sentry.captureException(e);
      throw unprocessable(e);
    }
  }

  static findByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }
}
