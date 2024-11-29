import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uktBills } from "@/db/schema";
import type { UktBillBase, UktBillPayload } from "./uktBills.schema";
import { notFound } from "@/common/utils";
import { getBillIssueById, getProdiById } from "@/common/getter";

export abstract class UktBillService {
  static async getAll() {
    const data = await db.select().from(uktBills);

    return data;
  }

  static async find(id: number) {
    const data = await db.query.uktBills.findFirst({
      where: eq(uktBills.id, id),
    });

    if (!data) throw notFound();

    const prodi = await getProdiById(data.majorId);
    const billIssue = await getBillIssueById(data.billIssueId);
    
    return { ...data, prodi: { ...prodi }, billIssue: { ...billIssue } };
  }

  static async create(payload: UktBillPayload, multibankToken?: string) {
    const [data] = await db.insert(uktBills).values(payload).returning();

    const prodi = await getProdiById(data.majorId);
    if (!prodi) {
      throw notFound("kode prodi tidak valid");
    }

    const billIssue = await getBillIssueById(data.billIssueId, multibankToken);
    if (!billIssue) {
      throw notFound("kode bill issue tidak valid");
    }

    return data;
  }

  static async edit(id: number, data: Partial<UktBillBase>) {
    const [uktBill] = await db
      .update(uktBills)
      .set(data)
      .where(eq(uktBills.id, id))
      .returning();

    if (!uktBill) throw notFound("UktBill not found");
    return data;
  }

  static async delete(id: number) {
    const [data] = await db
      .delete(uktBills)
      .where(eq(uktBills.id, id))
      .returning();

    if (!data) throw notFound();
    return data;
  }
}
