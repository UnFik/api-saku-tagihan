import { db } from "@/db";
import { queueTracker
 } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateQueueTrackerStatus(
  queueId: number,
  status: "COMPLETED" | "FAILED",
  error?: string
) {
  try {
    await db
      .update(queueTracker)
      .set({
        status,
        endDate: new Date().toISOString(),
        description: error ? `${error}` : undefined,
      })
      .where(eq(queueTracker.id, queueId));
  } catch (err) {
    console.error(`Error updating queue tracker status:`, err);
  }
}
