import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, notFound, unauthorized } from "../../common/utils";
import { userInsert } from "./users.schema";
import { UserService } from "./users.service";
import { formattedUser } from "./users.utils";

const usersController = new Elysia()
  .use(jwt)
  .post(
    "login",
    async ({ body, jwt }) => {
      // return "Hello";
      const { username, password } = body;

      const user = await UserService.authenticate(username, password);

      const token = await jwt.sign({ id: user.id });
      return { user: { ...formattedUser(user), token } };
    },
    {
      body: t.Object({ username: t.String(), password: t.String() }),
    }
  );

export default usersController;
