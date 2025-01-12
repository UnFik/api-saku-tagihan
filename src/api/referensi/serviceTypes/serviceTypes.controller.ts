import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { ServiceTypeService } from "./serviceTypes.service";
import { serviceTypeBase, serviceTypeInsert, serviceTypeQuery } from "./serviceTypes.schema";

const serviceTypesController = new Elysia({
  prefix: "/referensi/service-types",
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
            const data = await ServiceTypeService.getAll(query);
            return data;
          },
          {
            query: serviceTypeQuery,
          }
        )
        .post(
          "",
          async ({ body, set }) => {
            const data = await ServiceTypeService.create(body);
            set.status = 201;
            return data;
          },
          {
            body: serviceTypeInsert,
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await ServiceTypeService.find(id);
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
            const data = await ServiceTypeService.edit(id, body);
            return data;
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Partial(serviceTypeBase),
          }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await ServiceTypeService.delete(id);
            return data;
          },
          { params: t.Object({ id: t.Number() }) }
        )
  );

export default serviceTypesController;