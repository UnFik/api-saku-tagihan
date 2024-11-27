import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uktBills } from "@/db/schema";
import type { UktBillPayload } from "./uktBills.schema";
import { notFound } from "@/common/utils";

export abstract class UktBillService {
  static async getAll() {
    const data = await db.select().from(uktBills);

    return data;
  }

  static async find(id: number) {
    const data = await db.query.uktBills.findFirst({
      where: eq(uktBills.id, id),
    });

    if (!data) throw notFound();
    return data;
  }

  static async create(payload: UktBillPayload) {
    const [data] = await db.insert(uktBills).values(payload).returning();

    return data;
  }

  static async edit(id: number, payload: UktBillPayload) {
    const [data] = await db
      .update(uktBills)
      .set(payload)
      .where(eq(uktBills.id, id))
      .returning();

    if (!data) throw notFound();
    return this.find(data.id);
  }

  static async delete(id: number) {
    const [data] = await db
      .delete(uktBills)
      .where(eq(uktBills.id, id))
      .returning();

    if (!data) throw notFound();
    return data;
  }
}
