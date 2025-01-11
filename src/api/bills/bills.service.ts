import { db } from "@/db";
import { bills, unit } from "@/db/schema";
import type { BillBase, BillInsert, BillQuery } from "./bills.schema";
import { generateTokenMultibank, unprocessable } from "@/common/utils";
import { env } from "bun";
import { eq } from "drizzle-orm";

export abstract class BillService {
  static async getAll(query: BillQuery) {
    const data = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        name: bills.name,
        semester: bills.semester,
        nim: bills.nim,
        amount: bills.amount,
        flagStatus: bills.flagStatus,
        dueDate: bills.dueDate,
        billIssue: bills.billIssue,
        billIssueId: bills.billIssueId,
        billGroupId: bills.billGroupId,
        paidDate: bills.paidDate,
        unitId: bills.unitId,
        createdAt: bills.createdAt,
        updateAt: bills.updateAt,
        unitName: unit.name,
        code: unit.code,
        company: unit.company,
      })
      .from(bills)
      .leftJoin(unit, eq(unit.id, bills.unitId));

    return { data, success: true, message: "Berhasil mendapatkan data tagihan" };
  }

  static async find(id: number) {
    const data = await db
      .select()
      .from(bills)
      .where(eq(bills.id, id))
      .leftJoin(unit, eq(unit.id, bills.unitId));

    if (!data)
      return {
        success: false,
        status: 404,
      };

    return { data, success: true, message: "Berhasil mendapatkan data tagihan" };
  }

  static async create(payload: BillInsert) {
    const [unitId] = await db
      .select()
      .from(unit)
      .where(eq(unit.id, payload.unitId));

    if (!unitId) {
      return {
        success: false,
        status: 400,
        message: "Unit tidak ditemukan",
      };
    }
    const isExist = await db
      .select()
      .from(bills)
      .where(eq(bills.billNumber, payload.billNumber));

    if (isExist.length > 0) {
      return {
        success: false,
        status: 400,
        message: "Nomor tagihan sudah digunakan",
      };
    }
    const data = await db.insert(bills).values(payload).returning();
    return { data: data[0], success: true, message: "Berhasil membuat tagihan" };
  }

  // static async create(payload: BillInsert, multibankToken?: string) {
  //   if (!multibankToken) {
  //     multibankToken = await generateTokenMultibank();
  //   }

  //   try {
  //     const res = await fetch(`${env.MULTIBANK_API_URL}/tagihan`, {
  //       method: "POST",
  //       headers: {
  //         Accept: "application/json",
  //         Authorization: `Bearer ${multibankToken}`,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ ...payload, filename: undefined }),
  //     });

  //     if (res.status !== 200) {
  //       return res.json();
  //     }

  //     console.log(res);
  //     const data = await res.json();
  //     console.log(data);

  //     const upload = await db
  //       .insert(bills)
  //       .values({ billNumber: data.billNumber, filename: payload.filename })
  //       .returning()
  //       .then((res) => res[0]);

  //     if (!upload) {
  //       return {
  //         success: false,
  //         status: 404,
  //         message: "Gagal Mengupload File",
  //       };
  //     }
  //     return data;
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //     throw unprocessable(error);
  //   }
  // }

  static async edit(billNumber: number, payload: BillBase) {
    try {
      const res = await db
        .update(bills)
        .set({
          amount: payload.amount,
          ...(payload.dueDate && { dueDate: payload.dueDate.toISOString() }),
        })
        .where(eq(bills.billNumber, billNumber))
        .returning();

      const data = res[0];
      return { data, success: true };
      // const res = await fetch(
      //   `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
      //   {
      //     method: "PUT",
      //     headers: {
      //       Accept: "application/json",
      //       Authorization: `Bearer ${multibankToken}`,
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(payload),
      //   }
      // );

      // const data = res.json();
      // return data;
    } catch (error) {
      throw unprocessable(error);
      return { data: error, success: false, status: 400 };
    }
  }

  static async delete(billNumber: number, multibankToken?: string) {
    if (!multibankToken) {
      multibankToken = await generateTokenMultibank();
    }

    try {
      const res = await fetch(
        `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${multibankToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = res.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw unprocessable(error);
    }
  }
}
