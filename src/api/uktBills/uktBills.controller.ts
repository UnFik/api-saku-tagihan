import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import {
  generateTokenMultibank,
  getAuthUserId,
  unauthorized,
} from "@/common/utils";
import { UktBillService } from "./uktBills.service";
import { uktBillBase } from "./uktBills.schema";

const uktBillsController = new Elysia({
  prefix: "/tagihan-ukt",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({
        headers: { authorization, ...headers },
        cookie: { authorization: cookieAuthorization },
      }) {
        if (!authorization && !cookieAuthorization.value) {
          throw unauthorized();
        }
      },
    },
    (app) =>
      app
        .resolve(getAuthUserId)
        .get("", async () => {
          const data = await UktBillService.getAll();
          return { data, success: true, message: "Data retrieved" };
        })
        .post(
          "",
          async ({ body, set, cookie: { multibank } }) => {
            const data = await UktBillService.create(body, multibank.value);
            set.status = 201;
            return {
              data,
              success: true,
              message: `Data successfully created`,
            };
          },
          {
            body: t.Object({
              semester: t.String(),
              nim: t.String(),
              name: t.String(),
              description: t.String(),
              billNumber: t.String(),
              amount: t.Number(),
              uktCategory: t.String(),
              filename: t.String(),
              dueDate: t.String(),
              flagStatus: t.Union([
                t.Literal("88"),
                t.Literal("01"),
                t.Literal("02"),
              ]),

              majorId: t.String(),
              billIssueId: t.String(),
            }),
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await UktBillService.find(id);
            set.status = 200;
            return { data, success: true, message: "Data retrieved" };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await UktBillService.delete(id);
            set.status = 200;
            return { data, success: true, message: "Data deleted" };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set }) => {
            const data = await UktBillService.edit(id, body);
            set.status = 200;
            return { data, success: true, message: "Data updated" };
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Partial(uktBillBase),
          }
        )
  );

export default uktBillsController;
