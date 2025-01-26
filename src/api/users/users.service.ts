import { db } from "@/db";
import type { AuthSiakad } from "./users.schema";
// ignore ts-line
import { env } from "bun";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcrypt";

export abstract class UserService {
  static async authenticate(username: string, password: string) {
    let user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return undefined;
    }

    const match = await compare(password, user.password);
    if (match) {
      return user;
    }

    return undefined;
  }
  // try {
  //   const formData = new FormData();
  //   formData.append("username", username);
  //   formData.append("password", password);

  //   const response = await fetch(
  //     `${env.SIAKAD_API_URL_PRIVATE}/as400/signin/`,
  //     {
  //       method: "POST",
  //       body: formData,
  //       headers: {
  //         Accept: "application/json",
  //       },
  //     }
  //   );

  //   const data: AuthSiakad = await response.json();
  //   console.log(data);
  //   return data;
  // } catch (error) {
  //   console.error("Error authenticating user:", error);
  //   return undefined;
  // }

  // static find(id: string) {
  //   return db.query.users.findFirst({
  //     where: eq(users.id, id),
  //   });
  // }

  // static update(id: string, data: Partial<UserInsert>) {
  //   try {
  //     return db.update(users).set(data).where(eq(users.id, id));
  //   } catch (e) {
  //     Sentry.captureException(e);
  //     throw unprocessable(e);
  //   }
  // }

  // static findByUsername(username: string) {
  //   return db.query.users.findFirst({
  //     where: eq(users.username, username),
  //   });
  // }
}
