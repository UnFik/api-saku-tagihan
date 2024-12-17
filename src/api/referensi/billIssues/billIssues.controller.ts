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
        headers: { authorization, multibank },
        cookie: { authorization: cookieAuthorization },
      }) {
        if (!authorization && !cookieAuthorization.value || multibank) {
          throw unauthorized();
        }
      },
    },
    (app) =>
      app
        .resolve(getAuthUserId)
        .get("", async ({ headers, cookie: { multibank } }) => {
          const data = await BillIssueService.getAll(multibank.value || headers.multibank);
          return data;
        })
        .post(
          "",
          async ({ headers, body, set, cookie: { multibank } }) => {
            const data = await BillIssueService.create(body, multibank.value || headers.multibank);
            set.status = 201;
            return data;
          },
          {
            body: billIssueBase,
          }
        )
        .get(
          "/:id",
          async ({ headers, params: { id }, set, cookie: { multibank } }) => {
            const data = await BillIssueService.find(id, multibank.value || headers.multibank);
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ headers, params: { id }, set, cookie: { multibank } }) => {
            const data = await BillIssueService.delete(id, multibank.value || headers.multibank);
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
          async ({ headers, params: { id }, body, set, cookie: { multibank } }) => {
            const data = await BillIssueService.edit(id, body, multibank.value || headers.multibank);
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
