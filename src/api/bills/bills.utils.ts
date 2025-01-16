import { db } from "@/db";
import { bills } from "@/db/schema";
import { eq } from "drizzle-orm";

export const toggleStatusConfirmed = async (
  billNumber: number,
  isConfirmed?: boolean
) => {
  const [bill] = await db
    .select({
      isConfirmed: bills.isConfirmed,
    })
    .from(bills)
    .where(eq(bills.billNumber, billNumber));

  if (!bill) {
    return false;
  }

  const data = await db
    .update(bills)
    .set({
      isConfirmed: isConfirmed !== undefined ? isConfirmed : !bill.isConfirmed,
    })
    .where(eq(bills.billNumber, billNumber))
    .returning({ id: bills.id });

  return true;
};

export function notFoundResponse(message: string) {
  return {
    success: false,
    status: 404,
    message,
  };
}

export function internalServerErrorResponse(message: string) {
  return {
    success: false,
    status: 500,
    message,
  };
}
