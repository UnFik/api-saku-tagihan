import { unprocessable } from "@/common/utils";
import { BillGroupsInsert, BillGroupsPayload } from "./billGroups.schema";
import { refreshTokenMultibank } from "@/common/utils";
import { env } from "bun";
import * as Sentry from "@sentry/bun";
import { ResponseService } from "@/types";

export abstract class BillGroupService {
  static async getAll(tokenMultibank?: string): Promise<ResponseService> {
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_group`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
        },
      });

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.getAll(new_token);
      }

      const data = await res.json();

      return data;
    } catch (error) {
      console.error("Error fetching bill groups:", error);
      Sentry.captureException(error);
      throw unprocessable(error);
    }
  }

  static async create(
    billGroupPayload: BillGroupsInsert,
    tokenMultibank?: string
  ): Promise<ResponseService> {
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_group`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billGroupPayload),
      });

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.create(billGroupPayload, new_token);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      Sentry.captureException(error);
      throw unprocessable(error);
    }
  }

  static async find(
    id: number,
    tokenMultibank?: string
  ): Promise<ResponseService> {
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_group/${id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
        },
      });

      if (res.status == 404) {
        const data = await res.json();
        return data;
      }

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.find(id, new_token);
      }

      const data = await res.json();

      return data;
    } catch (error) {
      console.error("Error fetching bill group:", error);
      throw unprocessable(error);
    }
  }

  static async edit(
    id: number,
    billGroupPayload: BillGroupsPayload,
    tokenMultibank?: string
  ): Promise<ResponseService> {
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    tokenMultibank = tokenMultibank
      ? decodeURIComponent(tokenMultibank)
      : undefined;

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_group/${id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
        },
        body: JSON.stringify(billGroupPayload),
      });

      if (res.status == 404) {
        const data = await res.json();
        return data;
      }

      if (res.status == 401 || !res.ok) {
        const new_token = await refreshTokenMultibank();
        return this.edit(id, billGroupPayload, new_token);
      }

      const data = await res.json();
      if (!data) throw unprocessable();
      return data;
    } catch (error) {
      console.error("Error editing bill group:", error);
      throw unprocessable(error);
    }
  }

  static async delete(
    id: number,
    tokenMultibank?: string
  ): Promise<ResponseService> {
    if (!tokenMultibank) {
      tokenMultibank = await refreshTokenMultibank();
    }

    try {
      const res = await fetch(`${env.MULTIBANK_API_URL}/bill_group/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenMultibank}`,
        },
      });

      if (res.status == 500) {
        return {
          status: 409,
          success: false,
          message: "Bill group masih digunakan",
          data: null,
        }
      }

      if (res.status == 404) {
        const data = await res.json();
        return data;
      }

      if (res.status == 401 || !res.ok) {
        return {
          success: false,
          status: 401,
          message: "Unauthorized",
          data: null,
        };
      }

      const data = await res.json();
      if (!data) throw unprocessable();
      return data;
    } catch (error) {
      console.error("Error deleting bill group:", error);
      throw unprocessable(error);
    }
  }
}
