import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import {
  generateTokenMultibank,
  getAuthUserId,
  notFound,
  unauthorized,
} from "../../common/utils";
import { userInsert } from "./users.schema";
import { UserService } from "./users.service";
import { formattedUser } from "./users.utils";

const usersController = new Elysia()
  .use(jwt)
  // .onRequest(async ({ set }) => {
  //   const tokenMultibank = await generateTokenMultibank();
  //   set.headers["multibank-token"] = tokenMultibank;
  // })
  .post(
    "login",
    async ({ body, jwt, set, cookie: { authorization, multibank } }) => {
      // return "Hello";
      const { username, password } = body;

      const user = await UserService.authenticate(username, password);

      const token = await jwt.sign({ id: user.id });
      const tokenMultibank = await generateTokenMultibank();

      // set.cookie
      authorization.value = token;
      authorization.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      multibank.value = tokenMultibank;

      set.headers["multibank-token"] = tokenMultibank;
      return {
        user: {
          ...formattedUser(user),
          token,
          "multibank-token": tokenMultibank,
        },
      };
    },
    {
      body: t.Object({ username: t.String(), password: t.String() }),
    }
  );
export default usersController;
