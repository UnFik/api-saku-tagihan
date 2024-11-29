import { Elysia, ValidationError } from "elysia";
import cors from "@elysiajs/cors";
import { unprocessable } from "./common/utils";
import usersController from "@/api/users/users.controller";
// import billTypesController from "@/api/referensi/billType/billTypes.controller";
import dispensationTypesController from "./api/referensi/dispensationType/dispensationTypes.controller";
import uktBillsController from "./api/uktBills/uktBills.controller";
import billIssuesController from "./api/referensi/billIssues/billIssues.controller";
import billGroupsController from "./api/referensi/billGroup/billGroups.controller";

const app = new Elysia({ prefix: "/api" })
  .use(cors())
  .onError(({ set, error }) => {
    set.headers["content-type"] = "application/json";
    if (error instanceof ValidationError) {
      /* attempting to return detailed error response while maintaing realworld api error response structure
  {"errors": {"body": [
            "Error in /user/username of type:string: Required property",
            "Error in /user/username of type:string: Expected string"
  ]} }*/
      try {
        return unprocessable(
          JSON.parse(error.message)["errors"].map(
            (o: Record<string, string>) =>
              `Error in ${o.path}${
                o.schema &&
                ` of ${Object.entries(o.schema).map((arr) => arr.join(" "))}`
              }: ${o.message}`
          )
        );
      } catch (e) {
        return unprocessable(error.message);
      }
    }
  })
  .use(usersController)
  .use(billIssuesController)
  .use(billGroupsController)
  .use(dispensationTypesController)
  .use(uktBillsController)
  .get("/", () => "API SAKU TAGIHAN")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
