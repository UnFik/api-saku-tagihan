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
        .get(
          "",
          async ({ headers, cookie: { multibank } }) => {
            const data = await BillGroupService.getAll(
              multibank.value || headers.multibank
            );
            return data;
          },
          {
            detail: {
              tags: ["Bill Groups"],
              summary: "Mendapatkan semua data bill group",
              description:
                "Endpoint ini digunakan untuk mengambil semua data bill group",
              responses: {
                "200": {
                  description: "Berhasil mendapatkan data bill group",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "number" },
                            name: { type: "string" },
                            description: { type: "string" },
                            detail: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            updatedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
                "401": {
                  description:
                    "Unauthorized - Token tidak valid atau tidak ada",
                },
              },
              security: [
                {
                  bearerAuth: [],
                },
              ],
            },
          }
        )
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
