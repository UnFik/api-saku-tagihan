import { eq } from "drizzle-orm";
import { db } from "@/db";
// import { billIssues } from "@/db/schema";
import type {
  BillIssuePayload,
  BillIssueUpdatePayload,
} from "./billIssues.schema";
import { notFound, unprocessable } from "@/common/utils";
import { env } from "bun";
import { refreshTokenMultibank } from "@/common/utils";

export abstract class BillIssueService {
  static async getAll(token?: string): Promise<void> {
    if (!token) {
      token = await refreshTokenMultibank();
    }

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.getAll(new_token);
      }

      const data = await res.json();

      return data;
    } catch (error) {
      console.error("Error fetching bill issues:", error);
      throw unprocessable(error);
    }
  }

  static async find(id: number, token?: string): Promise<void> {
    if (!token) {
      token = await refreshTokenMultibank();
    }
    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.find(id, new_token);
      }

      const data = await res.json();

      return data;
    } catch (error) {
      console.error("Error fetching bill issue:", error);
      throw unprocessable(error);
    }
  }

  static async create(
    payload: BillIssuePayload,
    token?: string
  ): Promise<ResponseService> {
    if (!token) {
      token = await refreshTokenMultibank();
    }
    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(res);
      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.create(payload, new_token);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error creating bill issue:", error);
      throw unprocessable(error);
    }
  }

  static async edit(
    id: number,
    payload: BillIssueUpdatePayload,
    token?: string
  ): Promise<ResponseService> {
    if (!token) {
      token = await refreshTokenMultibank();
    }
    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status == 404) {
        const data = await res.json();
        return data;
      }

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.edit(id, payload, new_token);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error editing bill issue:", error);
      throw unprocessable(error);
    }
  }

  static async delete(id: number, token?: string): Promise<ResponseService> {
    if (!token) {
      token = await refreshTokenMultibank();
    }
    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_issue/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status == 404) {
        return {
          status: 404,
          success: false,
          message: `Data bill issue dengan id ${id} tidak ditemukan`,
        };
      }

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.delete(id, new_token);
      }

      const data = await res.json();
      if (!data) throw notFound();
      return data;
    } catch (error) {
      console.error("Error deleting bill issue:", error);
      throw unprocessable(error);
    }
  }
}
