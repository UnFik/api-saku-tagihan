import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { BillGroupService } from "./billGroups.service";
import { billGroupsInsert, billGroupsPayload } from "./billGroups.schema";

const billGroupsController = new Elysia({
  prefix: "/referensi/bill-group",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({
        headers: { authorization, multibank },
        cookie: {
          authorization: cookieAuthorization,
          multibank: tokenMultibank,
        },
      }) {
        if ((!authorization && !cookieAuthorization.value) || !multibank) {
          throw unauthorized();
        }
      },
    },
    (app) =>
      app
        .resolve(getAuthUserId)
        .get("", async ({ headers, cookie: { multibank } }) => {
          const data = await BillGroupService.getAll(
            multibank.value || headers.multibank
          );

          if (data.success) {
            return {
              success: true,
              status: data.status,
              message: data.message,
              data: data.data.reverse(),
            }
          }
          
          return data;
        })
        .post(
          "",
          async ({ headers, body, set, cookie: { multibank } }) => {
            const data = await BillGroupService.create(
              body,
              multibank.value || headers.multibank
            );
            set.status = 201;
            return data;
          },
          {
            body: billGroupsInsert,
          }
        )
        .get(
          "/:id",
          async ({ headers, params: { id }, set, cookie: { multibank } }) => {
            const data = await BillGroupService.find(
              id,
              multibank.value || headers.multibank
            );
            if (!data.success) {
              set.status = data.status;
              return data;
            }
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ headers, params: { id }, set, cookie: { multibank } }) => {
            const data = await BillGroupService.delete(
              id,
              multibank.value || headers.multibank
            );
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
          async ({
            params: { id },
            body,
            headers,
            set,
            cookie: { multibank },
          }) => {
            const data = await BillGroupService.edit(
              id,
              body,
              multibank.value || headers.multibank
            );
            if (!data.success) {
              set.status = data.status;
              return data;
            }
            set.status = 200;
            return data;
          },
          {
            params: t.Object({ id: t.Number() }),
            body: billGroupsPayload,
          }
        )
  );
export default billGroupsController;
