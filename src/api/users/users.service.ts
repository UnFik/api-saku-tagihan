import type { AuthSiakad } from "./users.schema";
// ignore ts-line
import { env } from "bun";

export abstract class UserService {
  static async authenticate(username: string, password: string) {
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(
        `${env.SIAKAD_API_URL_PRIVATE}/as400/signin/`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log(response);

      const data: AuthSiakad = await response.json();
      return data;
    } catch (error) {
      console.error("Error authenticating user:", error);
      return undefined;
    }
  }

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
