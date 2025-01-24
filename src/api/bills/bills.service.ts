import { db } from "@/db";
import { bills, refJournals, serviceTypes, unit } from "@/db/schema";
import type {
  BillBase,
  BillInsert,
  BillInsertWithoutNumber,
  BillQuery,
  BillSelect,
} from "./bills.schema";
import {
  generateTokenJurnal,
  refreshTokenMultibank,
  unprocessable,
} from "@/common/utils";
import { eq, and, or, type SQL, inArray } from "drizzle-orm";
import { filterColumn } from "@/common/filter-column";
import { DrizzleWhere, ResponseService } from "@/types";
import { BillConfirm } from "./bills.schema";
import { env } from "bun";
import {
  internalServerErrorResponse,
  notFoundResponse,
  toggleStatusConfirmed,
} from "./bills.utils";
export abstract class BillService {
  static async getAll(query: BillQuery) {
    const {
      semester,
      unitCode,
      billIssueId,
      serviceTypeId,
      per_page,
      operator,
    } = query;

    const expressions: (SQL<unknown> | undefined)[] = [
      semester
        ? filterColumn({
            column: bills.semester,
            value: semester,
          })
        : undefined,
      unitCode
        ? filterColumn({
            column: unit.code,
            value: unitCode,
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
        isConfirmed: bills.isConfirmed,
        serviceType: {
          id: bills.serviceTypeId,
          name: serviceTypes.name,
          type: serviceTypes.type,
          typeServiceId: serviceTypes.typeServiceId,
        },
        unitId: bills.unitCode,
        unitName: unit.name,
        unitCode: unit.code,
        createdAt: bills.createdAt,
        updateAt: bills.updateAt,
      })
      .from(bills)
      .leftJoin(unit, eq(unit.code, bills.unitCode))
      .leftJoin(serviceTypes, eq(serviceTypes.id, bills.serviceTypeId))
      .where(where);

    return {
      data,
      success: true,
      message: "Berhasil mendapatkan data tagihan",
    };
  }

  static async find(billNumber: number) {
    const data = await db
      .select()
      .from(bills)
      .where(eq(bills.billNumber, billNumber))
      .leftJoin(unit, eq(unit.code, bills.unitCode));

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

  static async create(payload: BillInsertWithoutNumber) {
    // const [unitId] = await db
    //   .select()
    //   .from(unit)
    //   .where(eq(unit.code, String(payload.unitCode)));

    // if (!unitId) {
    //   return {
    //     success: false,
    //     status: 400,
    //     message: "Unit tidak ditemukan",
    //   };
    // }

    const billNumber = parseInt(
      `${payload.identityNumber}${payload.semester}${String(
        payload.billGroupId
      ).padStart(3, "0")}`
    );

    console.log(billNumber)
    const isExist = await db
      .select()
      .from(bills)
      .where(eq(bills.billNumber, billNumber));

    if (isExist.length > 0) {
      return {
        success: false,
        status: 400,
        message: "Nomor tagihan sudah digunakan",
      };
    }
    const data = await db
      .insert(bills)
      .values({ ...payload, billNumber })
      .returning();

    return {
      data: data[0],
      success: true,
      message: "Berhasil membuat tagihan",
    };
  }

  static async edit(billNumber: number, payload: BillBase) {
    if (
      payload.flagStatus &&
      !["01", "02", "88"].includes(payload.flagStatus)
    ) {
      return {
        success: false,
        status: 400,
        message: "Flag status tidak valid",
      };
    }

    try {
      const existingBill = await db
        .select()
        .from(bills)
        .where(eq(bills.billNumber, billNumber));

      if (existingBill.length === 0) {
        return {
          success: false,
          status: 404,
          message: "Nomor tagihan tidak ditemukan",
        };
      }

      if (
        existingBill[0].amount === payload.amount &&
        existingBill[0].dueDate?.toString() ==
          payload.dueDate?.toISOString().split("T")[0] &&
        existingBill[0].flagStatus === payload.flagStatus
      ) {
        return {
          success: true,
          status: 200,
          message: "Berhasil memperbarui tagihan",
        };
      }

      const res = await db
        .update(bills)
        .set({
          amount: payload.amount,
          dueDate: payload.dueDate
            ? payload.dueDate.toISOString().split("T")[0]
            : null,
          flagStatus: payload.flagStatus as "88" | "01" | "02",
        })
        .where(eq(bills.billNumber, billNumber))
        .returning();

      await toggleStatusConfirmed(billNumber, false);

      const data = res[0];
      return { data, success: true };
    } catch (error) {
      throw unprocessable(error);
      // return { data: error, success: false, status: 400 };
    }
  }

  static async delete(
    billNumber: number,
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;
    tokenJurnal = tokenJurnal ? decodeURIComponent(tokenJurnal) : undefined;

    try {
      const existingBill = await db
        .select()
        .from(bills)
        .where(eq(bills.billNumber, billNumber));

      if (existingBill.length === 0) {
        return {
          success: false,
          status: 404,
          message: "Nomor tagihan tidak ditemukan",
        };
      }

      const [data] = existingBill;

      const multibankResponse = await fetch(
        `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenMultibank}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (multibankResponse.status === 401) {
        const new_token = await refreshTokenMultibank();
        return this.delete(billNumber, tokenJurnal, new_token);
      }

      const multibankData = await multibankResponse.json();

      if (!multibankData.success) {
        await db
          .delete(bills)
          .where(eq(bills.billNumber, billNumber))
          .returning({
            id: bills.id,
            name: bills.name,
            billNumber: bills.billNumber,
            unitCode: bills.unitCode,
            identityNumber: bills.identityNumber,
            semester: bills.semester,
            amount: bills.amount,
          });

        return {
          status: 200,
          success: true,
          message: `Data tagihan ${billNumber} berhasil dihapus`,
        };
      }

      if (!tokenJurnal) {
        tokenJurnal = await generateTokenJurnal();
      }
      if (!tokenMultibank) {
        tokenMultibank = await refreshTokenMultibank();
      }

      const resDeleteMultibank = await fetch(
        `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenMultibank}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (resDeleteMultibank.status == 401) {
        const new_token = await refreshTokenMultibank();
        return this.confirm({ billNumber: billNumber }, new_token);
      }

      const jurnalResponse = await fetch(
        `${env.JURNAL_API_URL}/create-jurnal`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenJurnal}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tanggal: new Date().toISOString().split("T")[0],
            idTransaksi: 45,
            noBukti: `${data.unitCode}/${data.semester}/${data.identityNumber}`,
            jumlah: data.amount,
            keterangan: `Tagihan UKT semester ${data.semester} untuk ${data.identityNumber}`,
            pic: "Admin Fakultas",
            kodeUnit: data.unitCode,
          }),
        }
      );

      if (jurnalResponse.status === 401 || !jurnalResponse.ok) {
        const new_token = await generateTokenJurnal();
        return this.delete(billNumber, new_token, tokenMultibank);
      }

      const jurnalData = await jurnalResponse.json();

      if (jurnalData.message !== "success") {
        return {
          status: 400,
          success: false,
          message: "Gagal konfirmasi tagihan pada API Jurnal",
        };
      }

      await db.delete(bills).where(eq(bills.billNumber, billNumber)).returning({
        id: bills.id,
        name: bills.name,
        billNumber: bills.billNumber,
        unitCode: bills.unitCode,
        identityNumber: bills.identityNumber,
        semester: bills.semester,
        amount: bills.amount,
      });

      return {
        data,
        status: 200,
        success: true,
        message: `Berhasil menghapus tagihan ${billNumber}`,
      };
    } catch (error) {
      console.error(error);
      throw unprocessable(error);
    }
  }

  static async createMany(payload: BillInsertWithoutNumber[]) {
    try {
      // Validasi unit untuk setiap tagihan
      // const unitCodes = [...new Set(payload.map((bill) => bill.unitCode))];
      // const units = await db
      //   .select()
      //   .from(unit)
      //   .where(inArray(unit.code, unitCodes));

      // if (units.length !== unitCodes.length) {
      //   return {
      //     success: false,
      //     status: 400,
      //     message: "Beberapa kode unit tidak ditemukan",
      //     data: unitCodes.filter(
      //       (code) => !units.some((unit) => unit.code === code)
      //     ),
      //   };
      // }

      // Validasi nomor tagihan unik
      const billNumbers = payload.map((bill) =>
        parseInt(
          `${bill.identityNumber}${bill.semester}${bill.billGroupId.padStart(
            3,
            "0"
          )}`
        )
      );
      const existingBills = await db
        .select()
        .from(bills)
        .where(inArray(bills.billNumber, billNumbers));

      if (existingBills.length > 0) {
        return {
          success: false,
          status: 400,
          message: "Beberapa nomor tagihan sudah digunakan",
          data: existingBills.map((bill) => bill.billNumber),
        };
      }

      // Insert batch tagihan
      const data = await db
        .insert(bills)
        .values(
          payload.map((bill) => ({
            ...bill,
            billNumber: parseInt(
              `${bill.identityNumber}${
                bill.semester
              }${bill.billGroupId.padStart(3, "0")}`
            ),
          }))
        )
        .returning();

      return {
        data: data.map((bill) => bill.billNumber),
        success: true,
        message: `Berhasil membuat ${data.length} tagihan`,
      };
    } catch (error) {
      console.error("Error creating bills:", error);
      throw unprocessable(error);
    }
  }

  static async confirm(
    payload: BillConfirm,
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
    const { billNumber, amount, dueDate } = payload;

    const tanggalJurnal = new Date().toISOString().split("T")[0];

    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;
    tokenJurnal = tokenJurnal ? decodeURIComponent(tokenJurnal) : undefined;

    if (!tokenJurnal) {
      tokenJurnal = await generateTokenJurnal();
    }
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    // Ambil data tagihan dari database
    const [bill] = await db
      .select({
        billIssueId: bills.billIssueId,
        billGroupId: bills.billGroupId,
        amount: bills.amount,
        identityNumber: bills.identityNumber,
        semester: bills.semester,
        name: bills.name,
        flagStatus: bills.flagStatus,
        dueDate: bills.dueDate,
        unitCode: bills.unitCode,
        isConfirm: bills.isConfirmed,
      })
      .from(bills)
      .where(eq(bills.billNumber, billNumber));

    if (!bill) {
      return notFoundResponse(
        `Bill Number Tagihan ${billNumber} tidak ditemukan`
      );
    }

    if (bill.isConfirm) {
      return notFoundResponse(
        `Bill Number Tagihan ${billNumber} sudah dikonfirmasi`
      );
    }

    await toggleStatusConfirmed(billNumber);

    const resDataMultibank = await fetch(
      `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (resDataMultibank.status == 401) {
      await toggleStatusConfirmed(billNumber);
      const new_token = await refreshTokenMultibank();
      return this.confirm(payload, new_token);
    }

    if (!resDataMultibank.ok && resDataMultibank.status != 404) {
      await toggleStatusConfirmed(billNumber);
      console.error(
        "Terdapat Kesalahan pada Get Multibank di Bills Service",
        resDataMultibank
      );
      return internalServerErrorResponse(
        `Internal Server Error: ${resDataMultibank.statusText}`
      );
    }

    const resBillMultibank = await resDataMultibank.json();
    const billMultibank = resBillMultibank.data;

    switch (resBillMultibank.success) {
      case true: {
        const formDataEditMultibank = new FormData();
        formDataEditMultibank.append("amount", amount ? String(amount) : "");
        formDataEditMultibank.append(
          "due_date",
          dueDate ? String(dueDate) : ""
        );
        formDataEditMultibank.append("flag_status", bill.flagStatus);

        const resEditMultibank = await fetch(
          `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${tokenMultibank}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formDataEditMultibank),
          }
        );

        if (resEditMultibank.status == 401) {
          await toggleStatusConfirmed(billNumber);
          const new_token = await refreshTokenMultibank();
          return this.confirm({ billNumber: billNumber }, new_token);
        }

        const dataMultibank = await resEditMultibank.json();
        if (!dataMultibank.success) {
          await toggleStatusConfirmed(billNumber);

          return {
            status: dataMultibank.status,
            success: false,
            message: dataMultibank.message,
          };
        }

        await db
          .update(bills)
          .set({ flagStatus: bill.flagStatus })
          .where(eq(bills.billNumber, billNumber));

        let amountJurnal: number | undefined = amount
          ? amount - billMultibank.amount
          : undefined;

        if (!amountJurnal) {
          return {
            data: {
              nim: bill.identityNumber,
              name: bill.name,
            },
            success: true,
            status: 200,
            message: "Data Tenggat Tagihan berhasil dikonfirmasi",
          };
        }

        const isPositive = amountJurnal > 0;

        amountJurnal = Math.abs(amountJurnal);

        const formJurnal = {
          tanggal: tanggalJurnal,
          idTransaksi: isPositive ? 1 : 45,
          noBukti: `${bill.unitCode}/${bill.semester}/${bill.identityNumber}`,
          jumlah: amountJurnal,
          keterangan: `Tagihan UKT semester ${bill.semester} untuk ${bill.identityNumber}`,
          pic: "Admin Fakultas",
          kodeUnit: bill.unitCode,
        };

        const resJurnal = await fetch(`${env.JURNAL_API_URL}/create-jurnal`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenJurnal}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formJurnal),
        });

        if (resJurnal.status == 401 || !resJurnal.ok) {
          await toggleStatusConfirmed(billNumber);

          const new_token = await generateTokenJurnal();
          return this.confirm({ billNumber: billNumber }, new_token);
        }

        const dataJurnal = await resJurnal.json();

        if (dataJurnal.message != "success") {
          await toggleStatusConfirmed(billNumber);

          return {
            status: 400,
            success: false,
            message: "Gagal konfirmasi tagihan pada API Jurnal",
          };
        }

        await db.insert(refJournals).values({
          id: Number(dataJurnal.id_jurnal),
          description: formJurnal.keterangan,
          amount: formJurnal.jumlah,
          billNumber: billNumber,
        });

        console.info(`${billNumber} di Edit ke Multibank`);

        return {
          data: {
            jurnalId: dataJurnal.id_jurnal,
            nim: bill.identityNumber,
            name: bill.name,
          },
          status: 200,
          success: true,
          message: `Berhasil konfirmasi edit tagihan ${billNumber}`,
        };
      }

      case false: {
        const formDataMultibank = new FormData();
        formDataMultibank.append("bill_issue_id", String(bill.billIssueId));
        formDataMultibank.append("bill_group_id", String(bill.billGroupId));
        formDataMultibank.append("amount", String(bill.amount));
        formDataMultibank.append("nim", bill.identityNumber);
        formDataMultibank.append("semester", String(bill.semester));
        formDataMultibank.append("name", bill.name);
        formDataMultibank.append("flag_status", String(bill.flagStatus));
        formDataMultibank.append("due_date", bill.dueDate ? bill.dueDate : "");

        // return { data: formDataMultibank, status: 200, success: true, message: "Tes" };

        const resMultibank = await fetch(`${env.MULTIBANK_API_URL}/tagihan`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tokenMultibank}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataMultibank),
        });

        if (resMultibank.status == 401) {
          await toggleStatusConfirmed(billNumber);
          const new_token = await refreshTokenMultibank();
          return this.confirm({ billNumber: billNumber }, new_token);
        }

        const dataMultibank = await resMultibank.json();
        if (!dataMultibank.success) {
          await toggleStatusConfirmed(billNumber);

          return {
            status: dataMultibank.status,
            success: false,
            message: dataMultibank.message,
          };
        }

        try {
          const dataJurnal = {
            tanggal: tanggalJurnal,
            idTransaksi: 1,
            noBukti: `${bill.unitCode}/${bill.semester}/${bill.identityNumber}`,
            jumlah: bill.amount,
            keterangan: `Tagihan UKT semester ${bill.semester} untuk ${bill.identityNumber}`,
            pic: "Admin Fakultas",
            kodeUnit: bill.unitCode,
          };

          const resJurnal = await fetch(`${env.JURNAL_API_URL}/create-jurnal`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${tokenJurnal}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataJurnal),
          });

          if (resJurnal.status == 401 || !resJurnal.ok) {
            await toggleStatusConfirmed(billNumber);

            const new_token = await generateTokenJurnal();
            return this.confirm({ billNumber: billNumber }, new_token);
          }

          const data = await resJurnal.json();

          if (data.message != "success") {
            await toggleStatusConfirmed(billNumber);

            return {
              status: 400,
              success: false,
              message: "Gagal konfirmasi tagihan pada API Jurnal",
            };
          }

          await db.insert(refJournals).values({
            id: Number(data.id_jurnal),
            description: dataJurnal.keterangan,
            amount: dataJurnal.jumlah,
            billNumber: billNumber,
          });

          console.info(`${billNumber} di Tambah ke Multibank`);
          return {
            data: {
              jurnalId: data.jurnalId,
              nim: bill.identityNumber,
              name: bill.name,
            },
            status: 200,
            success: true,
            message: `Berhasil konfirmasi tambah tagihan ${billNumber}`,
          };
        } catch (error) {
          console.error(error);
          throw unprocessable(error);
        }
      }
      default: {
        return {
          success: false,
          status: 400,
          message: "Response tidak valid dari Multibank",
        };
      }
    }
  }

  static async publishMany(payload: { billNumber: number }[]) {
    try {
      const billNumbers = payload.map((bill) => bill.billNumber);

      // Cek apakah semua tagihan ada
      const existingBills = await db
        .select({
          billNumber: bills.billNumber,
          isConfirmed: bills.isConfirmed,
          flagStatus: bills.flagStatus,
        })
        .from(bills)
        .where(inArray(bills.billNumber, billNumbers));

      if (existingBills.length !== billNumbers.length) {
        const foundBillNumbers = existingBills.map((bill) => bill.billNumber);
        const notFoundBills = billNumbers.filter(
          (number) => !foundBillNumbers.includes(number)
        );

        return {
          success: false,
          status: 404,
          message: "Beberapa nomor tagihan tidak ditemukan",
          data: notFoundBills,
        };
      }

      // Pisahkan tagihan berdasarkan statusnya
      const billsToUpdate = existingBills.filter(
        (bill) => bill.flagStatus == "88"
      );
      const alreadyPublishedBills = existingBills.filter(
        (bill) => bill.flagStatus == "01"
      );

      // Update flag status menjadi "01" (aktif) untuk tagihan yang bisa diupdate
      const updatedBills =
        billsToUpdate.length > 0
          ? await db
              .update(bills)
              .set({
                flagStatus: "01",
              })
              .where(
                inArray(
                  bills.billNumber,
                  billsToUpdate.map((bill) => bill.billNumber)
                )
              )
              .returning({
                billNumber: bills.billNumber,
              })
          : [];

      for (const bill of billsToUpdate) {
        await toggleStatusConfirmed(bill.billNumber, false);
      }

      return {
        success: true,
        message: `Berhasil mempublikasikan ${updatedBills.length} tagihan`,
        data: {
          updated: updatedBills.map((bill) => bill.billNumber),
          skipped: {
            alreadyPublished: alreadyPublishedBills.map(
              (bill) => bill.billNumber
            ),
          },
        },
      };
    } catch (error) {
      console.error("Error publishing bills:", error);
      throw unprocessable(error);
    }
  }

  static async paymentMany(payload: { billNumber: number }[]) {
    try {
      const billNumbers = payload.map((bill) => bill.billNumber);

      // Cek apakah semua tagihan ada
      const existingBills = await db
        .select({
          billNumber: bills.billNumber,
          isConfirmed: bills.isConfirmed,
          flagStatus: bills.flagStatus,
        })
        .from(bills)
        .where(inArray(bills.billNumber, billNumbers));

      if (existingBills.length !== billNumbers.length) {
        const foundBillNumbers = existingBills.map((bill) => bill.billNumber);
        const notFoundBills = billNumbers.filter(
          (number) => !foundBillNumbers.includes(number)
        );

        return {
          success: false,
          status: 404,
          message: "Beberapa nomor tagihan tidak ditemukan",
          data: notFoundBills,
        };
      }

      // Pisahkan tagihan berdasarkan statusnya
      const billsToUpdate = existingBills.filter(
        (bill) => bill.flagStatus == "01" && bill.isConfirmed
      );
      const alreadyPaidBills = existingBills.filter(
        (bill) => bill.flagStatus == "02"
      );
      const onHoldBills = existingBills.filter(
        (bill) => bill.flagStatus == "88"
      );
      const unConfirmedBills = existingBills.filter(
        (bill) => !bill.isConfirmed
      );

      // console.log(billsToUpdate, alreadyPaidBills, invalidBills);
      // Update flag status menjadi "02" (sudah dibayar) untuk tagihan yang aktif
      const updatedBills =
        billsToUpdate.length > 0
          ? await db
              .update(bills)
              .set({
                flagStatus: "02",
              })
              .where(
                inArray(
                  bills.billNumber,
                  billsToUpdate.map((bill) => bill.billNumber)
                )
              )
              .returning({
                billNumber: bills.billNumber,
              })
          : [];

      return {
        success: true,
        message: `Berhasil mengubah status ${updatedBills.length} tagihan menjadi sudah dibayar`,
        data: {
          updated: updatedBills.map((bill) => bill.billNumber),
          skipped: {
            alreadyPaid: alreadyPaidBills.map((bill) => bill.billNumber),
            onHold: onHoldBills.map((bill) => bill.billNumber),
            notConfirmed: unConfirmedBills.map((bill) => bill.billNumber),
          },
        },
      };
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw unprocessable(error);
    }
  }
}
