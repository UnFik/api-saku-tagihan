import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { BillService } from "./bills.service";
import {
  billBase,
  billConfirm,
  billInsert,
  billInsertWithoutNumber,
  billQuery,
} from "./bills.schema";

const billsController = new Elysia({
  prefix: "/tagihan-ukt",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({
        headers: { authorization, ...headers },
        cookie: { authorization: cookieAuthorization, ...cookie },
      }) {
        if (!authorization && !cookieAuthorization.value) {
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
          async ({ body, set }) => {
            const data = await BillService.create(body);
            set.status = 201;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: billInsertWithoutNumber,
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
          { params: t.Object({ billNumber: t.String() }) }
        )
        .delete(
          "/:billNumber",
          async ({
            params: { billNumber },
            set,
            cookie: { multibank, tokenjurnal },
            headers,
          }) => {
            const data = await BillService.delete(
              billNumber,
              multibank.value ?? headers.multibank,
              tokenjurnal.value ?? headers.tokenJurnal
            );
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          { params: t.Object({ billNumber: t.String() }) }
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
            params: t.Object({ billNumber: t.String() }),
            body: billBase,
          }
        )
        .post(
          "/batch",
          async ({ body, set }) => {
            const data = await BillService.createMany(body);
            set.status = 201;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: t.Array(billInsertWithoutNumber),
          }
        )
        .post(
          "/confirm",
          async ({ body, set, headers, cookie: { multibank, tokenjurnal } }) => {
            const data = await BillService.confirm(
              body,
              multibank.value ??  headers.multibank,
              tokenjurnal.value ?? headers.tokenjurnal 
            );
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: billConfirm,
          }
        )
        .put(
          "/publish",
          async ({ body, set }) => {
            const billPayload = body.billNumbers.map((billNumber) => ({
              billNumber,
            }));
            const data = await BillService.publishMany(billPayload);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: t.Object({
              billNumbers: t.Array(t.String()),
            }),
          }
        )
        .put(
          "/payment",
          async ({ body, set }) => {
            const billPayload = body.billNumbers.map((billNumber) => ({
              billNumber,
            }));
            const data = await BillService.paymentMany(billPayload);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: t.Object({
              billNumbers: t.Array(t.String()),
            }),
          }
        )
  );

export default billsController;
