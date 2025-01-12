import { db } from "@/db";
import { serviceTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ServiceTypeBase, ServiceTypeInsert, ServiceTypeQuery } from "./serviceTypes.schema";
import { notFound, unprocessable } from "@/common/utils";

export abstract class ServiceTypeService {
  static async getAll(query: ServiceTypeQuery) {
    const data = await db.select().from(serviceTypes);
    return {
      data,
      success: true,
      message: "Berhasil mendapatkan data jenis layanan"
    };
  }

  static async find(id: number) {
    const data = await db.query.serviceTypes.findFirst({
      where: eq(serviceTypes.id, id),
    });

    if (!data) {
      return {
        success: false,
        status: 404,
        message: "Data jenis layanan tidak ditemukan"
      };
    }

    return { 
      data, 
      success: true,
      message: "Berhasil mendapatkan data jenis layanan"
    };
  }

  static async create(payload: ServiceTypeInsert) {
    try {
      const [data] = await db.insert(serviceTypes).values(payload).returning();
      return { 
        data, 
        success: true,
        message: "Berhasil membuat data jenis layanan"
      };
    } catch (error) {
      throw unprocessable(error);
    }
  }

  static async edit(id: number, payload: Partial<ServiceTypeBase>) {
    try {
      const [data] = await db
        .update(serviceTypes)
        .set(payload)
        .where(eq(serviceTypes.id, id))
        .returning();

      if (!data) throw notFound();
      return { 
        data, 
        success: true,
        message: "Berhasil mengubah data jenis layanan"
      };
    } catch (error) {
      throw unprocessable(error);
    }
  }

  static async delete(id: number) {
    const [data] = await db
      .delete(serviceTypes)
      .where(eq(serviceTypes.id, id))
      .returning();

    if (!data) throw notFound();
    return { 
      data, 
      success: true,
      message: "Berhasil menghapus data jenis layanan"
    };
  }
}
