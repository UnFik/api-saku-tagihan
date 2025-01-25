import { Elysia, t } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { ActivationService } from "./activation.service";

const activationController = new Elysia({
  prefix: "/referensi/activation",
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
          return await ActivationService.get();
        })
        .put(
          "",
          async ({ body }) => {
            return await ActivationService.update(body.semester);
          },
          {
            body: t.Object({
              semester: t.String(),
            }),
          }
        )
  );

export default activationController;
