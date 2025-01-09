import { db } from "@/db";
import { uktBills } from "@/db/schema";
import type { UktBillInsert, UktBillQuery } from "./uktBills.schema";
import { generateTokenMultibank, unprocessable } from "@/common/utils";
import { env } from "bun";

export abstract class UktBillService {
  static async getAll(query: UktBillQuery, token?: string) {
    if (!token) {
      token = await generateTokenMultibank();
    }
    const { semester = "", bill_issue = "", per_page = "", prodi = "" } = query;

    try {
      const data = await fetch(
        `${env.MULTIBANK_API_URL}/tagihan?semester=${semester}&bill_issue=${bill_issue}&per_page=${per_page}&prodi=${prodi}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return data.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw unprocessable(error);
    }
  }

  static async find(id: number, token?: string) {
    if (!token) {
      token = await generateTokenMultibank();
    }

    try {
      const data = await fetch(`${env.MULTIBANK_API_URL}/tagihan/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return data.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw unprocessable(error);
    }
  }

  static async create(payload: UktBillInsert, multibankToken?: string) {
    if (!multibankToken) {
      multibankToken = await generateTokenMultibank();
    }

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/tagihan`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${multibankToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, filename: undefined }),
      });

      if (res.status !== 200) {
        return res.json();
      }

      console.log(res);
      const data = await res.json();
      console.log(data);

      const upload = await db
        .insert(uktBills)
        .values({ id: data.bill_number, filename: payload.filename })
        .returning()
        .then((res) => res[0]);

      if (!upload) {
        return {
          success: false,
          status: 404,
          message: "Gagal Mengupload File",
        };
      }
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw unprocessable(error);
    }
  }

  static async edit(
    billNumber: number,
    payload: Partial<UktBillInsert>,
    multibankToken?: string
  ) {
    if (!multibankToken) {
      multibankToken = await generateTokenMultibank();
    }

    try {
      const res = await fetch(
        `${env.MULTIBANK_API_URL}/tagihan/${billNumber}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${multibankToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = res.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw unprocessable(error);
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
