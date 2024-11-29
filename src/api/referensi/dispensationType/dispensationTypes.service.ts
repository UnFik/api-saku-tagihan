import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dispensationTypes } from "@/db/schema";
import type { DispensationTypeBase, DispensationTypePayload } from "./dispensationTypes.schema";
import { notFound } from "@/common/utils";

export abstract class DispensationTypeService {
  static async getAll() {
    return await db.query.dispensationTypes.findMany();
  }

  static async find(id: number) {
    const data = await db.query.dispensationTypes.findFirst({
      where: eq(dispensationTypes.id, id),
    });

    if (!data) throw notFound();
    return data;
  }

  static async create(payload: DispensationTypePayload) {
    const existing = await db.query.dispensationTypes.findFirst({
      where: eq(dispensationTypes.name, payload.name)
    })

    if (existing) {
      return undefined; 
    }

    const [data] = await db.insert(dispensationTypes).values(payload).returning();
    return data;
  }

  static async edit(id: number, data: Partial<DispensationTypeBase>) {
    const [dispensationType] = await db
      .update(dispensationTypes)
      .set(data)
      .where(eq(dispensationTypes.id, id))
      .returning();

    if (!dispensationType) throw notFound();
    return dispensationType;
  }

  static async delete(id: number) {
    const [data] = await db
      .delete(dispensationTypes)
      .where(eq(dispensationTypes.id, id))
      .returning();

    if (!data) throw notFound();
    return data;
  }
}
