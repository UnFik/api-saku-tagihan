import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { DispensationTypeService } from "./dispensationTypes.service";
import { dispensationTypeBase } from "./dispensationTypes.schema";

const dispensationTypesController = new Elysia({
  prefix: "/referensi/dispensation-type",
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
        .get("", async () => {
          const data = await DispensationTypeService.getAll();
          return {
            data,
            success: true,
            message: "Berhasil mendapatkan data semua jenis dispensasi",
          };
        })
        .post(
          "",
          async ({ body, set }) => {
            const data = await DispensationTypeService.create(body);
            set.status = 201;
            return {
              success: true,
              message: `Berhasil membuat data jenis dispensasi`,
              data,
            };
          },
          {
            body: dispensationTypeBase,
          }
        )
        .get(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await DispensationTypeService.find(id);
            set.status = 200;
            return {
              success: true,
              message: "Berhasil membuat data jenis dispensasi",
              data,
            };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .delete(
          "/:id",
          async ({ params: { id }, set }) => {
            const data = await DispensationTypeService.delete(id);
            set.status = 200;
            return {
              success: true,
              message: "Berhasil menghapus data jenis dispensasi",
              data,
            };
          },
          { params: t.Object({ id: t.Number() }) }
        )
        .put(
          "/:id",
          async ({ params: { id }, body, set }) => {
            const data = await DispensationTypeService.edit(id, body);
            set.status = 200;
            return {
              success: true,
              message: "Berhasil memperbarui data jenis dispensasi",
              data,
            };
          },
          {
            params: t.Object({ id: t.Number() }),
            body: t.Partial(dispensationTypeBase),
          }
        )
  );

export default dispensationTypesController;
