import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { UnitService } from "./unit.service";
import { unitBase, unitInsert, unitQuery } from "./unit.schema";

const unitController = new Elysia({
  prefix: "/unit",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({
        headers: { authorization },
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
        .get(
          "",
          async ({ query }) => {
            const data = await UnitService.getAll(query);
            return data;
          },
          {
            query: unitQuery,
          }
        )
        .post(
          "",
          async ({ body, set }) => {
            const data = await UnitService.create(body);
            set.status = 201;
            return data;
          },
          {
            body: unitInsert,
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await UnitService.find(id);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set }) => {
            const data = await UnitService.edit(id, body);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Partial(unitBase),
          }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await UnitService.delete(id);
            set.status = 200;
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .post("sync", async ({ set }) => {
          const data = await UnitService.sync();
          set.status = 200;
          return data;
        })
  );

export default unitController;
