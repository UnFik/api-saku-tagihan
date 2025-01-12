import { db } from "@/db";
import { bills, serviceTypes, unit } from "@/db/schema";
import type {
  BillBase,
  BillInsert,
  BillQuery,
  BillSelect,
} from "./bills.schema";
import { unprocessable } from "@/common/utils";
import { eq, and, or, type SQL } from "drizzle-orm";
import { filterColumn } from "@/common/filter-column";
import { DrizzleWhere } from "@/types";
export abstract class BillService {
  static async getAll(query: BillQuery) {
    const { semester, unitName, billIssueId, serviceTypeId, per_page, operator } =
      query;

    const expressions: (SQL<unknown> | undefined)[] = [
      semester
        ? filterColumn({
            column: bills.semester,
            value: semester,
          })
        : undefined,
      unitName
        ? filterColumn({
            column: unit.name,
            value: unitName,
          })
        : undefined,
      billIssueId
        ? filterColumn({
            column: bills.billIssueId,
            value: String(billIssueId),
          })
        : undefined,
      serviceTypeId
        ? filterColumn({
            column: bills.serviceTypeId,
            value: serviceTypeId,
          })
        : undefined,
    ];

    const where: DrizzleWhere<BillSelect> =
      !operator || operator === "and"
        ? and(...expressions)
        : or(...expressions);

    const data = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        name: bills.name,
        semester: bills.semester,
        identityNumber: bills.identityNumber,
        amount: bills.amount,
        flagStatus: bills.flagStatus,
        dueDate: bills.dueDate,
        billIssue: bills.billIssue,
        billIssueId: bills.billIssueId,
        billGroupId: bills.billGroupId,
        paidDate: bills.paidDate,
        serviceType: {
          id: bills.serviceTypeId,
          name: serviceTypes.name,
          type: serviceTypes.type,
          typeServiceId: serviceTypes.typeServiceId,
        },
        unitId: bills.unitId,
        unitName: unit.name,
        code: unit.code,
        createdAt: bills.createdAt,
        updateAt: bills.updateAt,
      })
      .from(bills)
      .leftJoin(unit, eq(unit.id, bills.unitId))
      .leftJoin(serviceTypes, eq(serviceTypes.id, bills.serviceTypeId))
      .where(where);

    return {
      data,
      success: true,
      message: "Berhasil mendapatkan data tagihan",
    };
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

    return {
      data,
      success: true,
      message: "Berhasil mendapatkan data tagihan",
    };
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
    return {
      data: data[0],
      success: true,
      message: "Berhasil membuat tagihan",
    };
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
    try {
      const [data] = await db
        .delete(bills)
        .where(eq(bills.billNumber, billNumber))
        .returning({
          id: bills.id,
          name: bills.name,
          billNumber: bills.billNumber,
        });

      if (!data) {
        return {
          success: false,
          status: 404,
          message: "Bill Number Tagihan tidak ditemukan",
        };
      }

      return {
        data,
        success: true,
        message: `Berhasil menghapus tagihan ${data.billNumber}`,
      };
    } catch (error) {
      console.error(error);
      throw unprocessable(error);
    }
  }
}
