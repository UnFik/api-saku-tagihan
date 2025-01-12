import { db } from "@/db";
import { unit } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UnitBase, UnitInsert, UnitQuery } from "./unit.schema";
import { notFound, unprocessable } from "@/common/utils";
import { env } from "bun";

export abstract class UnitService {
  static async getAll(query: UnitQuery) {
    const data = await db.select().from(unit);
    return { data, success: true };
  }

  static async find(id: number) {
    const data = await db.query.unit.findFirst({
      where: eq(unit.id, id),
    });

    if (!data) {
      return {
        success: false,
        status: 404,
      };
    }

    return { data, success: true };
  }

  static async create(payload: UnitInsert) {
    try {
      const [isExist] = await db
        .select()
        .from(unit)
        .where(eq(unit.code, payload.code));

      if (isExist) {
        return {
          success: false,
          status: 409,
          message: "Kode unit sudah digunakan",
        };
      }
      const [data] = await db.insert(unit).values(payload).returning();
      return { data, success: true };
    } catch (error) {
      throw unprocessable(error);
    }
  }

  static async edit(id: number, payload: Partial<UnitBase>) {
    try {
      const [isExist] = await db.select().from(unit).where(eq(unit.id, id));
      if (!isExist) {
        return { success: false, status: 404 };
      }

      const [data] = await db
        .update(unit)
        .set(payload)
        .where(eq(unit.id, id))
        .returning();

      if (!data) throw notFound();
      return { data, success: true };
    } catch (error) {
      throw unprocessable(error);
    }
  }

  static async delete(id: number) {
    const [data] = await db.delete(unit).where(eq(unit.id, id)).returning();

    if (!data) throw notFound();
    return { data, success: true };
  }

  static async sync() {
    const response = await fetch(
      `${env.SIAKAD_API_URL}/as400/programstudi/All`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const dataProdi: ResProdi = await response.json();
    console.log(dataProdi.isi);
    let dataSync = [];

    for (const item of dataProdi.isi) {
      const existingUnit = await db.query.unit.findFirst({
        where: eq(unit.code, item.kodeProdi),
      });

      let data;
      if (existingUnit) {
        // Update existing record
        [data] = await db
          .update(unit)
          .set({
            name: item.namaProdi,
            code: item.kodeProdi,
            company: item.namaFakultas,
          })
          .where(eq(unit.code, item.kodeProdi))
          .returning();
      } else {
        // Insert new record
        [data] = await db
          .insert(unit)
          .values({
            name: item.namaProdi,
            code: item.kodeProdi,
            company: item.namaFakultas,
            flag_status: "1",
          })
          .returning();
      }

      dataSync.push(data);
    }

    return {
      success: true,
      message: "Sinkron data unit berhasil",
      data: dataSync,
    };
  }
}
