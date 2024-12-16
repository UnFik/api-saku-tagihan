import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { BillIssueService } from "./billIssues.service";
import { billIssueBase, billIssueUpdatePayload } from "./billIssues.schema";

const billIssuesController = new Elysia({
  prefix: "/referensi/bill-issue",
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
        // .resolve(generateTokenMultibank)
        .get("", async ({ cookie: { multibank } }) => {
          const data = await BillIssueService.getAll(multibank.value);
          return data;
        })
        .post(
          "",
          async ({ body, set }) => {
            const data = await BillIssueService.create(body);
            set.status = 201;
            return data;
          },
          {
            body: billIssueBase,
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set, cookie: { multibank } }) => {
            const data = await BillIssueService.find(id, multibank.value);
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set, cookie: { multibank } }) => {
            const data = await BillIssueService.delete(id, multibank.value);
            if (!data.success) {
              set.status = data.status;
              return data;
            }
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set, cookie: { multibank } }) => {
            const data = await BillIssueService.edit(id, body, multibank.value);
            if (!data.success) {
              set.status = data.status;
              return data;
            }
            set.status = 200;
            return data;
          },
          {
            params: t.Object({ id: t.Number() }),
            body: billIssueUpdatePayload,
          }
        )
  );

export default billIssuesController;
