import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import {
  generateTokenMultibank,
  getAuthUserId,
  unauthorized,
} from "@/common/utils";
import { BillIssueService } from "./billIssues.service";

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
            return {
              data,
              success: true,
              message: `Berhasil membuat data bill issue`,
            };
          },
          {
            body: t.Object({
              bill_group_id: t.String(),
              semester: t.String(),
              description: t.String(),
              start_date: t.String(),
              end_date: t.String(),
            }),
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
            set.status = 200;
            return { data, success: true, message: "Data deleted" };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set, cookie: { multibank } }) => {
            const data = await BillIssueService.edit(id, body, multibank.value);
            set.status = 200;
            return { data, success: true, message: "Data updated" };
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Object({
              id: t.String(),
              name: t.String(),
              description: t.String(),
              billTypeId: t.Number(),
            }),
          }
        )
  );

export default billIssuesController;
