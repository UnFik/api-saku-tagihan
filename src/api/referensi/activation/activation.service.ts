import { db } from "@/db";
import { activationPeriods } from "@/db/schema";
import { unprocessable } from "@/common/utils";
import { ResponseService } from "@/types";

export abstract class ActivationService {
  static async update(semester: string): Promise<ResponseService> {
    try {
      const activationPeriod = await db.query.activationPeriods.findFirst();

      if (!activationPeriod) {
        await db.insert(activationPeriods).values({
          semester,
        });

        return {
          success: true,
          status: 201,
          message: "Berhasil menambahkan periode aktivasi",
          data: { semester },
        };
      }

      const data = await db
        .update(activationPeriods)
        .set({ semester })
        .returning();

      return {
        success: true,
        status: 200,
        message: "Berhasil mengubah periode aktivasi",
        data: data[0],
      };
    } catch (error) {
      console.error("Error updating activation period:", error);
      throw unprocessable(error);
    }
  }

  static async get(): Promise<ResponseService> {
    try {
      const data = await db.query.activationPeriods.findFirst();

      if (!data) {
        return {
          success: false,
          status: 404,
          message: "Periode aktivasi tidak ditemukan",
        };
      }

      return {
        success: true,
        status: 200,
        message: "Berhasil mendapatkan periode aktivasi",
        data,
      };
    } catch (error) {
      console.error("Error getting activation period:", error);
      throw unprocessable(error);
    }
  }
}
