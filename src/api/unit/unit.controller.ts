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
        .get("", async ({ headers }) => {
          const data = await UnitService.getAll(headers.tokenjurnal);
          return data;
        })
        .post(
          "",
          async ({ body, set }) => {
            const data = await UnitService.create(body);
            set.status = 201;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            body: unitInsert,
          }
        )
        .get(
          "/:unitCode",
          async ({ params: { unitCode }, set }) => {
            const data = await UnitService.find(unitCode);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          { params: t.Object({ unitCode: t.String() }) }
        )
        .put(
          "/:unitCode",
          async ({ params: { unitCode }, body, set }) => {
            const data = await UnitService.edit(unitCode, body);
            set.status = 200;
            if (!data.success) {
              set.status = data.status;
            }
            return data;
          },
          {
            params: t.Object({ unitCode: t.String() }),
            body: t.Partial(unitBase),
          }
        )
        .delete(
          "/:unitCode",
          async ({ params: { unitCode }, set }) => {
            const data = await UnitService.delete(unitCode);
            set.status = 200;
            return data;
          },
          { params: t.Object({ unitCode: t.String() }) }
        )
        // .post("sync", async ({ set }) => {
        //   const data = await UnitService.sync();
        //   set.status = 200;
        //   return data;
        // })
  );

export default unitController;
