import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { generateTokenJurnal, generateTokenMultibank } from "../../common/utils";
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
    async ({ body, jwt, set, cookie: { authorization, multibank, tokenjurnal } }) => {
      // return "Hello";
      const { username, password } = body;
      const user = await UserService.authenticate(username, password);
      if (!user) {
        set.status = 401;
        return {
          success: false,
          status: 401,
          message: "Invalid username or password",
        };
      }

      const token = await jwt.sign({ id: user.id, name: user.name, username: user.username });
      const tokenMultibank = await generateTokenMultibank();
      const tokenJurnal = await generateTokenJurnal()

      // set.cookie
      authorization.value = token;
      authorization.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      multibank.value = tokenMultibank;

      tokenjurnal.value = tokenJurnal;

      set.headers["multibank-token"] = tokenMultibank;
      set.headers["jurnal-token"] = tokenJurnal;
      return {
        user: {
          ...formattedUser(user),
          token,
          "multibank-token": tokenMultibank,
          "jurnal-token": tokenJurnal
        },
      };
    },
    {
      body: t.Object({ username: t.String(), password: t.String() }),
    }
  );
export default usersController;
