import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { BillService } from "./bills.service";
import { billBase, billInsert, billQuery } from "./bills.schema"

const billsController = new Elysia({
  prefix: "/tagihan-ukt",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({
        headers: { authorization, ...headers },
        cookie: { authorization: cookieAuthorization },
      }) {
        if (!authorization && !cookieAuthorization.value && headers.multibank) {
          throw unauthorized();
        }
      },
    },
    (app) =>
      app
        .resolve(getAuthUserId)
        .get(
          "",
          async ({ query }) => {
            const data = await BillService.getAll(query);
            return data;
          },
          {
            query: billQuery,
          }
        )
        .post(
          "",
          async ({ body, set, cookie: { multibank }, headers }) => {
            const data = await BillService.create(body);
            set.status = 201;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: billInsert,
          }
        )
        .get(
          "/:billNumber",
          async ({ params: { billNumber }, set }) => {
            const data = await BillService.find(billNumber);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          { params: t.Object({ billNumber: t.Number() }) }
        )
        .delete(
          "/:billNumber",
          async ({
            params: { billNumber },
            set,
            cookie: { multibank },
            headers,
          }) => {
            const data = await BillService.delete(
              billNumber,
              multibank.value ?? headers.multibank
            );
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          { params: t.Object({ billNumber: t.Number() }) }
        )
        .put(
          "/:billNumber",
          async ({ params: { billNumber }, body, set }) => {
            const data = await BillService.edit(billNumber, body);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            params: t.Object({ billNumber: t.Number() }),
            body: billBase,
          }
        )
  );

export default billsController;
