import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { DispensationTypeService } from "./dispensationTypes.service";

const dispensationTypesController = new Elysia({
  prefix: "/referensi/dispensationType",
})
  .use(jwt)
  .guard(
    {
      beforeHandle({ headers: { authorization, ...headers } }) {
        if (!authorization || authorization.toString() === "") {
          throw unauthorized();
        }
      },
    },
    (app) =>
      app
        .resolve(getAuthUserId)
        .get("", async () => {
          const data = await DispensationTypeService.getAll();
          return { data, success: true, message: "Data retrieved" };
        })
        .post(
          "",
          async ({ body, set }) => {
            const data = await DispensationTypeService.create(body);
            if (!data) {
              set.status = 400;
              return {
                success: false,
                message: "ID Dispensation Type already exist",
              };
            }
            set.status = 201;
            return {
              data,
              success: true,
              message: `Data successfully created`,
            };
          },
          {
            body: t.Object({
              id: t.Number(),
              name: t.String(),
              description: t.String(),
            }),
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await DispensationTypeService.find(id);
            set.status = 200;
            return { data, success: true, message: "Data retrieved" };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await DispensationTypeService.delete(id);
            set.status = 200;
            return { data, success: true, message: "Data deleted" };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set }) => {
            const data = await DispensationTypeService.edit(id, body);
            set.status = 200;
            return { data, success: true, message: "Data updated" };
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Object({ id: t.Number(), name: t.String(), description: t.String() }),
          }
        )
  );

export default dispensationTypesController;
