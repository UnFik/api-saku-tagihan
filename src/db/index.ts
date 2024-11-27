import "dotenv/config";
import { logger } from "../common/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: schema,
  logger: logger,
});
