// import "./common/instrument";
import { Elysia, ValidationError } from "elysia";
import cors from "@elysiajs/cors";
import { generateTokenMultibank, unprocessable } from "./common/utils";
import usersController from "@/api/users/users.controller";
// import billTypesController from "@/api/referensi/billType/billTypes.controller";
import dispensationTypesController from "./api/referensi/dispensationType/dispensationTypes.controller";
import billsController from "./api/bills/bills.controller";
import billIssuesController from "./api/referensi/billIssues/billIssues.controller";
import billGroupsController from "./api/referensi/billGroup/billGroups.controller";
import { swagger } from "@elysiajs/swagger";
import unitController from "@/api/unit/unit.controller";

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: "*",
      allowedHeaders: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "SAKU TAGIHAN",
          description: "API SAKU TAGIHAN Documentation",
          version: "1.0.0",
        },
        tags: [{ name: "App", description: "General endpoints" }],
      },
      path: "/docs",
    })
  )
  .onError(({ set, error, code }: { set: any; error: any; code: any }) => {
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
  .use(billsController)
  .use(unitController)
  .get("/refresh-token", async ({ cookie: { multibank } }) => {
    const token = await generateTokenMultibank();

    // Set cookie dengan konfigurasi yang lebih aman
    multibank.set({
      httpOnly: true,
      maxAge: 60 * 60, // 1 jam
      value: token,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    return { token };
  })
  .get("/", () => "API SAKU TAGIHAN")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
