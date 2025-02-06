import { db } from "@/db";
import { bills } from "@/db/schema";
import { env } from "bun";
import { eq } from "drizzle-orm";

export const toggleStatusConfirmed = async (
  billNumber: string,
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

export async function getPicProdi(kodeProdi: string) {
  const res = await fetch(
    `${env.SIAKAD_API_URL}/as400/programstudi/${kodeProdi}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    return null;
  }
  const result = await res.json();
  return result.isi[0].namaFakultas;
}

export function getJournalDescription(
  journalId: number,
  semester: string,
  identityNumber: string,
  billIssue: string
) {
  switch (journalId) {
    case 1: // Tagihan UKT
    case 45:
      return `Tagihan UKT semester ${semester} untuk ${identityNumber} ${billIssue}`;
    case 6: // Tagihan SPP Labschool  
    case 52:
      return `Tagihan SPP Labschool periode ${semester} untuk ${identityNumber} ${billIssue}`;
    case 46: // Tagihan TTKa Ceria
    case 53:
      return `Tagihan TTKA Ceria periode ${semester} untuk ${identityNumber} ${billIssue}`;
    case 47: // Tagihan Pkh, SD, PGSD, dll
    case 54:
      return `Tagihan Pkh, SD PGSD, dll periode ${semester} untuk ${identityNumber} ${billIssue}`;
    default:
      return `Tidak diketahui, id ${journalId} tidak terdaftar`;
  }
}
