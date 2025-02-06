import { db } from "@/db";
import {
  bills,
  queueTracker,
  refJournals,
  serviceTypes,
  unit,
} from "@/db/schema";
import type {
  BillBase,
  BillConfirmAllPayload,
  BillInsertWithoutNumber,
  BillQuery,
  BillSelect,
} from "./bills.schema";
import {
  generateTokenJurnal,
  internalServerErrorResponse,
  notFoundResponse,
  refreshTokenMultibank,
  unauthorizedResponse,
  unprocessable,
} from "@/common/utils";
import { eq, and, or, type SQL, inArray, sql, desc } from "drizzle-orm";
import { filterColumn } from "@/common/filter-column";
import { DrizzleWhere, ResponseService } from "@/types";
import { BillConfirm } from "./bills.schema";
import { env } from "bun";
import {
  getJournalDescription,
  getPicProdi,
  toggleStatusConfirmed,
} from "./bills.utils";
import { BillIssueService } from "../referensi/billIssues/billIssues.service";
import { addBillConfirmJob, addBillCreateJob } from "@/common/queue";

export abstract class BillService {
  static async getAll(query: BillQuery) {
    const {
      semester,
      unitCode,
      billIssueId,
      serviceTypeId,
      per_page = 15,
      page = 1,
      major,
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
      major
        ? filterColumn({
            column: bills.major,
            value: major,
          })
        : undefined,
    ];

    const where: DrizzleWhere<BillSelect> =
      !operator || operator === "and"
        ? and(...expressions)
        : or(...expressions);

    const offset = (page - 1) * per_page;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bills)
      .where(where);

    // Get paginated data
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
        major: bills.major,
        unitId: bills.unitCode,
        createdAt: bills.createdAt,
        updatedAt: bills.updateAt,
      })
      .from(bills)
      .leftJoin(unit, eq(unit.code, bills.unitCode))
      .where(where)
      .limit(Number(per_page))
      .offset(offset)
      .orderBy(desc(bills.id));

    const totalPages = Math.ceil(count / per_page);
    const baseUrl = `${env.BASE_URL}/api/tagihan-ukt`;

    // Generate base query params from filters
    const queryParams = new URLSearchParams();
    if (semester) queryParams.set("semester", semester);
    if (unitCode) queryParams.set("unitCode", unitCode);
    if (billIssueId) queryParams.set("billIssueId", String(billIssueId));
    if (serviceTypeId) queryParams.set("serviceTypeId", String(serviceTypeId));
    if (major) queryParams.set("major", major);
    if (operator) queryParams.set("operator", operator);

    // Helper function to generate URL with query params
    const generateUrl = (pageNum: number | null) => {
      if (pageNum === null) return null;
      const params = new URLSearchParams(queryParams);
      params.set("page", String(pageNum));
      params.set("per_page", String(per_page));
      return `${baseUrl}?${params.toString()}`;
    };

    // Generate pagination links
    const links = [];

    // Previous page
    // links.push({
    //   url: page > 1 ? generateUrl(page - 1) : null,
    //   label: "&laquo; Previous",
    //   active: false
    // });

    // Tentukan range halaman yang akan ditampilkan
    const range = 5;
    let startPage = Math.max(1, page - range);
    let endPage = Math.min(totalPages, page + range);

    // Tambahkan ellipsis di awal jika perlu
    if (startPage > 1) {
      links.push({
        url: generateUrl(1),
        label: "1",
        active: false,
      });
      if (startPage > 2) {
        links.push({
          url: null,
          label: "...",
          active: false,
        });
      }
    }

    // Numbered pages
    for (let i = startPage; i <= endPage; i++) {
      links.push({
        url: generateUrl(i),
        label: String(i),
        active: i === page,
      });
    }

    // Tambahkan ellipsis di akhir jika perlu
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push({
          url: null,
          label: "...",
          active: false,
        });
      }
      links.push({
        url: generateUrl(totalPages),
        label: String(totalPages),
        active: false,
      });
    }

    // Next page
    // links.push({
    //   url: page < totalPages ? generateUrl(page + 1) : null,
    //   label: "Next &raquo;",
    //   active: false
    // });

    return {
      current_page: page,
      data,
      first_page_url: generateUrl(1),
      from: offset + 1,
      last_page: totalPages,
      last_page_url: generateUrl(totalPages),
      links,
      next_page_url: page < totalPages ? generateUrl(page + 1) : null,
      path: baseUrl,
      per_page: Number(per_page),
      prev_page_url: page > 1 ? generateUrl(page - 1) : null,
      to: Math.min(offset + Number(per_page), count),
      total: count,
      success: true,
      message: "Berhasil mendapatkan data tagihan",
    };
  }

  static async find(billNumber: string) {
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

  static async create(
    payload: BillInsertWithoutNumber,
    tokenMultibank?: string
  ): Promise<ResponseService> {
    try {
      const activationPeriod = await db.query.activationPeriods.findFirst();
      if (!activationPeriod) {
        return {
          status: 500,
          success: false,
          message: "Terdapat masalah pada data aktivasi server",
        };
      }

      if (
        payload.serviceTypeId == 1 &&
        Number(payload.semester) < Number(activationPeriod.semester)
      ) {
        const res = await BillIssueService.find(
          Number(payload.billIssueId),
          tokenMultibank
        );

        if (!res.success) {
          return {
            success: false,
            status: 400,
            message:
              "Terdapat masalah pada Bill Issue, Bill Issue tidak ditemukan",
          };
        }

        const endDate = res.data.end_date;

        payload.dueDate = endDate;
      }

      const billNumber = `${payload.identityNumber}${payload.semester}${String(
        payload.billGroupId
      ).padStart(3, "0")}`;

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
        status: 200,
        success: true,
        message: "Berhasil membuat tagihan",
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        status: 500,
        message: "Terdapat kesalahan pada server.",
      };
    }
  }

  static async edit(billNumber: string, payload: BillBase) {
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
    billNumber: string,
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
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
        return unauthorizedResponse("Token Multibank tidak valid");
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
        return unauthorizedResponse("Token Multibank tidak valid");
      }

      if (!resDeleteMultibank.ok) {
        // Status di multibank sudah paid atau selesai, hanya hapus dari saku
        if (
          resDeleteMultibank.status == 405 ||
          resDeleteMultibank.status == 404
        ) {
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
            data,
            status: 200,
            success: true,
            message: `Berhasil menghapus tagihan ${billNumber}`,
          };
        }
      }
      let picProdi: string = await getPicProdi(data.unitCode);
      let kodeUnit: string;

      if (!picProdi) {
        const [unitJurnal] = await db
          .select()
          .from(unit)
          .where(eq(unit.code, data.unitCode));

        if (!unitJurnal) {
          console.log(`Unit ${data.unitCode} tidak ditemukan di database`);
          return {
            status: 400,
            success: false,
            message: "Gagal konfirmasi tagihan pada API Jurnal",
          };
        }

        picProdi = unitJurnal.name;
        kodeUnit = unitJurnal.code;
      } else {
        const [unitJurnal] = await db
          .select()
          .from(unit)
          .where(eq(unit.name, picProdi));

        kodeUnit = unitJurnal.code;
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
            tanggal: new Date().toISOString(),
            idTransaksi: 45,
            noBukti: `${data.unitCode}/${data.semester}/${data.identityNumber}`,
            jumlah: data.amount,
            keterangan: getJournalDescription(
              45,
              String(data.semester),
              data.identityNumber,
              data.billIssue
            ),
            pic: picProdi,
            kodeUnit: kodeUnit,
          }),
        }
      );

      if (jurnalResponse.status === 401 || !jurnalResponse.ok) {
        return unauthorizedResponse("Token Jurnal tidak valid");
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

  static async createMany(
    nameUploader: string,
    payload: BillInsertWithoutNumber[],
    tokenMultibank?: string
  ): Promise<ResponseService> {
    try {
      const activationPeriod = await db.query.activationPeriods.findFirst();
      if (!activationPeriod) {
        return {
          status: 500,
          success: false,
          message:
            "Terdapat masalah pada data aktivasi server, Silahkan isi data aktivasi terlebih dahulu",
        };
      }

      // Buat record tracking
      const [queueRecord] = await db
        .insert(queueTracker)
        .values({
          createdBy: String(nameUploader),
          totalData: payload.length,
          status: "PROCESSING",
          description: `Pembuatan tagihan massal sejumlah ${payload.length} data`,
        })
        .returning();

      // Bagi payload menjadi batch-batch yang lebih kecil
      const batchSize = 100;
      const batches =
        payload.length < batchSize
          ? [payload]
          : Array.from(
              { length: Math.ceil(payload.length / batchSize) },
              (_, i) => payload.slice(i * batchSize, (i + 1) * batchSize)
            );

      // Tambahkan setiap batch ke queue
      for (const batch of batches) {
        await addBillCreateJob({
          nameUploader,
          bills: batch,
          tokenMultibank,
          queueId: queueRecord.id,
        });
      }

      return {
        status: 200,
        success: true,
        message: `Memulai proses pembuatan ${payload.length} tagihan di background`,
        data: {
          queueId: queueRecord.id,
          totalData: payload.length,
          batchCount: batches.length,
        },
      };
    } catch (error) {
      const errId = Math.random().toString(36).substring(2, 7);
      console.error("Error queuing bill creation:", error, `ID: ${errId}`);
      return {
        success: false,
        status: 500,
        message: `Terdapat kesalahan pada server: ${errId}`,
      };
    }
  }

  static async confirm(
    payload: BillConfirm,
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
    try {
      const { billNumber, amount, dueDate } = payload;

      const tanggalJurnal = new Date().toISOString();

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
          billIssue: bills.billIssue,
          amount: bills.amount,
          identityNumber: bills.identityNumber,
          semester: bills.semester,
          name: bills.name,
          flagStatus: bills.flagStatus,
          dueDate: bills.dueDate,
          unitCode: bills.unitCode,
          isConfirm: bills.isConfirmed,
          typeServiceId: bills.serviceTypeId,
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
        unauthorizedResponse("Token Multibank telah kadaluarsa");
      }

      if (!resDataMultibank.ok && resDataMultibank.status != 404) {
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
          if (billMultibank.flag_status == "02") {
            await db
              .update(bills)
              .set({
                flagStatus: "02",
                isConfirmed: true,
              })
              .where(eq(bills.billNumber, billNumber));

            console.info(
              "Tagihan Terkonfirmasi, Data pada Multibank sudah lunas"
            );
            return {
              success: true,
              status: 409,
              message: "Tagihan sudah lunas",
            };
          }
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
            console.error("Token Multibank telah kadaluarsa");
            return unauthorizedResponse("Token Multibank telah kadaluarsa");
          }

          const dataMultibank = await resEditMultibank.json();
          if (!dataMultibank.success) {
            console.error(
              "Terdapat masalah pada Get Multibank di Bills Service",
              dataMultibank
            );
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
            await toggleStatusConfirmed(billNumber, true);
            console.log(
              "Data berhasil di konfirmasi, data besaran saku dan multibank sama"
            );
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

          let picProdi: string = await getPicProdi(bill.unitCode);
          let kodeUnit: string;

          if (!picProdi) {
            const [unitJurnal] = await db
              .select()
              .from(unit)
              .where(eq(unit.code, bill.unitCode));

            if (!unitJurnal) {
              console.log(`Unit ${bill.unitCode} tidak ditemukan di database`);
              return {
                status: 400,
                success: false,
                message:
                  "Gagal konfirmasi tagihan pada API Jurnal, Unit Tidak ditemukan",
              };
            }

            picProdi = unitJurnal.name;
            kodeUnit = unitJurnal.code;
          } else {
            const [unitJurnal] = await db
              .select()
              .from(unit)
              .where(eq(unit.name, picProdi));

            unitJurnal;

            kodeUnit = unitJurnal.code;
          }

          const formJurnal = {
            tanggal: tanggalJurnal,
            idTransaksi: isPositive ? 1 : 45,
            noBukti: `${bill.unitCode}/${bill.semester}/${bill.identityNumber}`,
            jumlah: amountJurnal,
            keterangan: getJournalDescription(
              isPositive ? 1 : 45,
              String(bill.semester),
              bill.identityNumber,
              bill.billIssue
            ),
            pic: picProdi,
            kodeUnit: kodeUnit,
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

          if (resJurnal.status == 401) {
            console.log("Token Jurnal sudah kadaluarsa");
            return unauthorizedResponse(
              "Gagal konfirmasi tagihan pada API Jurnal, Token Invalid"
            );
          }

          const dataJurnal = await resJurnal.json();

          if (!resJurnal.ok) {
            return {
              status: 400,
              success: false,
              message: "Gagal konfirmasi tagihan pada API Jurnal",
            };
          }

          await db.insert(refJournals).values({
            journalId: Number(dataJurnal.id_jurnal),
            description: formJurnal.keterangan,
            amount: formJurnal.jumlah,
            billNumber: billNumber,
          });

          console.info(`${billNumber} di Edit ke Multibank`);

          await toggleStatusConfirmed(billNumber, true);
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
          // Ubah dari FormData ke objek JSON langsung
          const multibankPayload = {
            bill_issue_id: String(bill.billIssueId),
            bill_group_id: String(bill.billGroupId),
            amount: String(bill.amount),
            nim: bill.identityNumber,
            semester: String(bill.semester),
            name: bill.name,
            flag_status: String(bill.flagStatus),
            due_date: bill.dueDate ? bill.dueDate : "",
          };

          const resMultibank = await fetch(`${env.MULTIBANK_API_URL}/tagihan`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${tokenMultibank}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(multibankPayload), // Kirim objek JSON langsung
          });

          if (resMultibank.status == 401) {
            const new_token = await refreshTokenMultibank();
            return this.confirm({ billNumber: billNumber }, new_token);
          }

          const dataMultibank = await resMultibank.json();
          if (!dataMultibank.success) {
            return {
              status: dataMultibank.status,
              success: false,
              message: dataMultibank.message,
            };
          }

          try {
            let picProdi: string = await getPicProdi(bill.unitCode);
            let kodeUnit: string;

            if (!picProdi) {
              const [unitJurnal] = await db
                .select()
                .from(unit)
                .where(eq(unit.code, bill.unitCode));

              if (!unitJurnal) {
                console.log(
                  `Unit ${bill.unitCode} tidak ditemukan di database`
                );
                return {
                  status: 400,
                  success: false,
                  message: "Gagal konfirmasi tagihan pada API Jurnal",
                };
              }

              picProdi = unitJurnal.name;
              kodeUnit = unitJurnal.code;
            } else {
              const [unitJurnal] = await db
                .select()
                .from(unit)
                .where(eq(unit.name, picProdi));

              kodeUnit = unitJurnal.code;
            }

            const dataJurnal = {
              tanggal: tanggalJurnal,
              idTransaksi: 1,
              noBukti: `${bill.unitCode}/${bill.semester}/${bill.identityNumber}`,
              jumlah: bill.amount,
              keterangan: `Tagihan UKT semester ${bill.semester} untuk ${bill.identityNumber} ${bill.billIssue}`,
              pic: picProdi,
              kodeUnit: kodeUnit,
            };

            const resJurnal = await fetch(
              `${env.JURNAL_API_URL}/create-jurnal`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${tokenJurnal}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(dataJurnal),
              }
            );

            if (resJurnal.status == 401 || !resJurnal.ok) {
              console.error("Gagal konfirmasi tagihan pada API Jurnal");
              return unauthorizedResponse(
                "Gagal konfirmasi tagihan pada API Jurnal"
              );
            }

            const data = await resJurnal.json();

            if (data.message != "success") {
              return {
                status: 400,
                success: false,
                message: "Gagal konfirmasi tagihan pada API Jurnal",
              };
            }

            await db.insert(refJournals).values({
              description: dataJurnal.keterangan,
              amount: dataJurnal.jumlah,
              billNumber: billNumber,
              journalId: Number(data.id_jurnal),
            });

            await toggleStatusConfirmed(billNumber, true);

            console.info(`${billNumber} di Tambah ke Multibank`);
            return {
              data: {
                jurnalId: data.id_jurnal,
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
    } catch (error) {
      console.error("Error confirming bills:", error);
      await toggleStatusConfirmed(payload.billNumber);
      throw unprocessable(error);
    }
  }

  static async publishMany(payload: { billNumber: string }[]) {
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

  static async paymentMany(payload: { billNumber: string }[]) {
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

  static async confirmMany(
    payload: { billNumber: string }[],
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
    try {
      const billNumbers = payload.map((bill) => bill.billNumber);

      // Cek apakah semua tagihan ada
      const existingBills = await db
        .select({
          billNumber: bills.billNumber,
          isConfirmed: bills.isConfirmed,
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
      const billsToConfirm = existingBills.filter((bill) => !bill.isConfirmed);
      const alreadyConfirmedBills = existingBills.filter(
        (bill) => bill.isConfirmed
      );

      // Konfirmasi tagihan yang belum dikonfirmasi
      const confirmedBills = [];
      const failedBills = [];

      for (const bill of billsToConfirm) {
        try {
          const result = await this.confirm(
            { billNumber: bill.billNumber },
            tokenMultibank,
            tokenJurnal
          );

          if (result.success) {
            confirmedBills.push(bill.billNumber);
          } else {
            failedBills.push({
              billNumber: bill.billNumber,
              message: result.message,
            });
          }
        } catch (error) {
          console.error(`Error confirming bill ${bill.billNumber}:`, error);
          failedBills.push({
            billNumber: bill.billNumber,
            message: "Terjadi kesalahan saat konfirmasi tagihan",
          });
        }
      }

      return {
        status: 200,
        success: true,
        message: `Berhasil mengkonfirmasi ${confirmedBills.length} tagihan`,
        data: {
          confirmed: confirmedBills,
          failed: failedBills,
          skipped: {
            alreadyConfirmed: alreadyConfirmedBills.map(
              (bill) => bill.billNumber
            ),
          },
        },
      };
    } catch (error) {
      console.error("Error confirming multiple bills:", error);
      throw unprocessable(error);
    }
  }

  static async confirmAll(
    nameUploader: String,
    payload: BillConfirmAllPayload,
    tokenMultibank?: string,
    tokenJurnal?: string
  ): Promise<ResponseService> {
    try {
      const { semester, billIssueId, major, operator } = payload;

      const expressions: (SQL<unknown> | undefined)[] = [
        semester
          ? filterColumn({ column: bills.semester, value: semester })
          : undefined,
        billIssueId
          ? filterColumn({
              column: bills.billIssueId,
              value: String(billIssueId),
            })
          : undefined,
        major ? filterColumn({ column: bills.major, value: major }) : undefined,
        eq(bills.serviceTypeId, 1),
        eq(bills.isConfirmed, false),
      ];

      const where: DrizzleWhere<BillSelect> =
        !operator || operator === "and"
          ? and(...expressions)
          : or(...expressions);

      const unconfirmedBills = await db.select().from(bills).where(and(where));

      if (unconfirmedBills.length === 0) {
        return {
          success: true,
          status: 200,
          message: "Tidak ada tagihan yang perlu dikonfirmasi",
          data: { confirmed: [], failed: [] },
        };
      }

      // Buat record tracking
      const [queueRecord] = await db
        .insert(queueTracker)
        .values({
          semester: semester || null,
          billIssue: billIssueId ? String(billIssueId) : null,
          major: major || null,
          createdBy: String(nameUploader),
          totalData: unconfirmedBills.length,
          status: "PROCESSING",
          description: `Konfirmasi tagihan massal${
            semester ? ` semester ${semester}` : ""
          }${major ? ` jurusan ${major}` : ""}${
            billIssueId ? ` bill issue ${billIssueId}` : ""
          }`,
        })
        .returning();

      // Tambahkan job ke queue untuk setiap tagihan
      for (const bill of unconfirmedBills) {
        await addBillConfirmJob({
          billNumber: bill.billNumber,
          amount: bill.amount,
          dueDate: bill.dueDate ? bill.dueDate : undefined,
          tokenMultibank,
          tokenJurnal,
          queueId: queueRecord.id,
        });
      }

      return {
        status: 200,
        success: true,
        message: `Memulai proses konfirmasi ${unconfirmedBills.length} tagihan di background`,
        data: {
          queueId: queueRecord.id,
          totalData: unconfirmedBills.length,
          filters: { semester, billIssueId, major, operator },
        },
      };
    } catch (error) {
      const errId = Math.random().toString(36).substring(2, 7);
      console.error("Error confirming all bills:", error, `ID: ${errId}`);
      return internalServerErrorResponse(
        `Terdapat kesalahan pada server: ${errId}`
      );
    }
  }
}
