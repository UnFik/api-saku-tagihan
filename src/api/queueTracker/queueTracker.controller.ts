import { Elysia } from "elysia";
import jwt from "@/common/jwt";
import { getAuthUserId, unauthorized } from "@/common/utils";
import { QueueTrackerService } from "./queueTracker.service";
import { queueTrackerQuery } from "./queueTracker.schema";

const queueTrackerController = new Elysia({
  prefix: "/queue-tracker",
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
          return await QueueTrackerService.getAll();
        })
  );

export default queueTrackerController;