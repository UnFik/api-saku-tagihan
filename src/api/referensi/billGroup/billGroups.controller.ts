import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { BillGroupService } from "./billGroups.service";

const billGroupsController = new Elysia({
  prefix: "/referensi/bill-group",
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
        .get("", async ({ cookie: { multibank } }) => {
          const data = await BillGroupService.getAll(multibank.value);
          return data;
        })
        .post(
          "",
          async ({ body, set, cookie: { multibank } }) => {
            const data = await BillGroupService.create(body, multibank.value);
            set.status = 201;
            return data;
          },
          {
            body: t.Object({
              name: t.String(),
              description: t.String(),
              detail: t.String(),
            }),
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await BillGroupService.find(id);
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await BillGroupService.delete(id);
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set }) => {
            const data = await BillGroupService.edit(id, body);
            set.status = 200;
            return data;
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Object({
              name: t.String(),
              description: t.String(),
              detail: t.String(),
            }),
          }
        )
  );
export default billGroupsController;
