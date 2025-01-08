import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { UktBillService } from "./uktBills.service";
import { uktBillInsert, uktBillQuery } from "./uktBills.schema";

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
          async ({ query, cookie: { multibank }, headers }) => {
            const data = await UktBillService.getAll(
              query,
              multibank.value || headers.multibank
            );
            return data;
          },
          {
            query: t.Partial(uktBillQuery),
          }
        )
        .post(
          "",
          async ({ body, set, cookie: { multibank }, headers }) => {
            const data = await UktBillService.create(
              body,
              multibank.value ?? headers.multibank
            );
            set.status = 201;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: uktBillInsert,
          }
        )
        .get(
          "/:billNumber",
          async ({
            params: { billNumber },
            set,
            cookie: { multibank },
            headers,
          }) => {
            const data = await UktBillService.find(
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
        .delete(
          "/:billNumber",
          async ({
            params: { billNumber },
            set,
            cookie: { multibank },
            headers,
          }) => {
            const data = await UktBillService.delete(
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
          async ({
            params: { billNumber },
            body,
            set,
            cookie: { multibank },
            headers,
          }) => {
            const data = await UktBillService.edit(
              billNumber,
              body,
              multibank.value ?? headers.multibank
            );
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            params: t.Object({ billNumber: t.Number() }),
            body: t.Partial(uktBillInsert),
          }
        )
  );

export default uktBillsController;
