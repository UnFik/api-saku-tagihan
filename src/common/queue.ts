import { Job, Queue, Worker } from "bullmq";
import { BillService } from "@/api/bills/bills.service";
import { toggleStatusConfirmed } from "@/api/bills/bills.utils";
import process from 'process';
import { BillInsertWithoutNumber } from "@/api/bills/bills.schema";
import { eq, sql } from "drizzle-orm";
import { queueTracker } from "@/db/schema";
import { db } from "@/db";
import { updateQueueTrackerStatus } from "@/api/queueTracker/queueTracker.utils";

// redis connection config
const connection = {
  host: "localhost",
  port: 6379,
};

export const billConfirmQueue = new Queue("bill-confirm", {
  connection,
  defaultJobOptions: {
    attempts: 3, // Jumlah percobaan maksimal
    backoff: {
      type: "exponential",
      delay: 1000, // Delay awal dalam ms
    },
  },
});

export const billConfirmWorker = new Worker(
  "bill-confirm",
  async (job: Job) => {
    const { billNumber, amount, dueDate, tokenMultibank, tokenJurnal, queueId } = job.data;

    try {
      // Update status menjadi PROCESSING jika ada queueId
      if (queueId) {
        await db.update(queueTracker)
          .set({
            status: "PROCESSING",
            updateAt: new Date()
          })
          .where(eq(queueTracker.id, queueId));
      }

      console.log(`Processing bill confirmation for ${billNumber}`);

      const result = await BillService.confirm(
        { billNumber, amount, dueDate },
        tokenMultibank,
        tokenJurnal
      );

      // Update counter sukses jika berhasil
      if (queueId && result.success) {
        await db.update(queueTracker)
          .set({
            successCount: sql`success_count + 1`,
            updateAt: new Date()
          })
          .where(eq(queueTracker.id, queueId));
      }

      console.log(`Confirmation result for ${billNumber}:`, result);
      return result;
    } catch (error) {
      // Update counter gagal jika terjadi error
      if (queueId) {
        await db.update(queueTracker)
          .set({
            failedCount: sql`failed_count + 1`,
            updateAt: new Date()
          })
          .where(eq(queueTracker.id, queueId));
      }

      console.error(`Error confirming bill ${billNumber}:`, {
        error: error,
        jobId: job.id,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },
  { connection }
);

billConfirmWorker.on("completed", async (job) => {
  try {
    const { billNumber, queueId } = job.data;
    
    // Update status di database
    await toggleStatusConfirmed(billNumber, true);
    
    if (queueId) {
      await updateQueueTrackerStatus(queueId, 'COMPLETED');
    }
    
    console.log(`Bill confirmation ${job.id} for ${billNumber} has completed!`);
  } catch (error) {
    console.error(`Error updating completion status:`, error);
  }
});

billConfirmWorker.on("failed", async (job, err) => {
  try {
    if (job) {
      const { billNumber, queueId } = job.data;
      console.log(`Bill confirmation ${job.id} for ${billNumber} has failed with ${err.message}`);
      
      if (queueId) {
        await updateQueueTrackerStatus(
          queueId, 
          'FAILED',
          `Gagal mengkonfirmasi tagihan ${billNumber}: ${err.message}`
        );
      }

      // Jika sudah mencapai batas percobaan
      if (job.attemptsMade >= job.opts.attempts!) {
        console.error(`Final failure for bill ${billNumber} after ${job.attemptsMade} attempts`);
      }
    }
  } catch (error) {
    console.error(`Error handling job failure:`, error);
  }
});

export async function addBillConfirmJob(data: {
  billNumber: string;
  amount?: number;
  dueDate?: string;
  tokenMultibank?: string;
  tokenJurnal?: string;
  queueId?: number;
}) {
  await billConfirmQueue.add("confirm-bill", data);
}

// Tambahkan queue baru untuk createMany
export const billCreateQueue = new Queue("bill-create", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

// Tambahkan worker baru
export const billCreateWorker = new Worker(
  "bill-create",
  async (job: Job) => {
    const { nameUploader, bills, tokenMultibank, queueId } = job.data;

    try {
      // 1. Memproses setiap tagihan dalam batch
      for (const bill of bills) {
        try {
          // 2. Mencoba membuat tagihan
          const result = await BillService.create(bill, tokenMultibank);
          
          // 3. Update counter sukses jika berhasil
          if (result.success) {
            await db.update(queueTracker)
              .set({
                successCount: sql`success_count + 1`,
                status: "PROCESSING",
                updateAt: new Date()
              })
              .where(eq(queueTracker.id, queueId));
          } else {
            // 4. Update counter gagal jika tidak berhasil
            await db.update(queueTracker)
              .set({
                failedCount: sql`failed_count + 1`,
                status: "PROCESSING",
                updateAt: new Date()
              })
              .where(eq(queueTracker.id, queueId));
          }
        } catch (error) {
          // 5. Update counter gagal jika terjadi error
          await db.update(queueTracker)
            .set({
              failedCount: sql`failed_count + 1`,
              status: "PROCESSING",
              updateAt: new Date()
            })
            .where(eq(queueTracker.id, queueId));
        }
      }

      // 6. Update status final batch
      await db.update(queueTracker)
        .set({
          status: "COMPLETED",
          updateAt: new Date()
        })
        .where(eq(queueTracker.id, queueId));
    } catch (error) {
      // 7. Update status jika terjadi error fatal
      await db.update(queueTracker)
        .set({
          status: "FAILED",
          description: `Error: ${error}`,
          updateAt: new Date()
        })
        .where(eq(queueTracker.id, queueId));
    }
  },
  { 
    connection,
    concurrency: 1 
  }
);

// Perbarui handler completed dan failed
billCreateWorker.on("completed", async (job) => {
  const { queueId } = job.data;
  console.log(`Bill creation batch ${job.id} has completed!`);
  
  // Cek total progress
  const tracker = await db.query.queueTracker.findFirst({
    where: eq(queueTracker.id, queueId)
  });
  
  if (tracker && (tracker.successCount + tracker.failedCount) >= tracker.totalData) {
    console.log('completed')
    await db.update(queueTracker)
      .set({
        status: "COMPLETED",
        endDate: new Date().toISOString(),
        updateAt: new Date()
      })
      .where(eq(queueTracker.id, queueId));
  }

});

billCreateWorker.on("failed", async (job, err) => {
  if (job) {
    console.error(`Bill creation batch ${job.id} has failed:`, err.message);
    await updateQueueTrackerStatus(
      job.data.queueId, 
      'FAILED',
      `Gagal memproses batch: ${err.message}`
    );
  }
});

// Tambahkan fungsi helper untuk menambahkan job
export async function addBillCreateJob(data: {
  nameUploader: string;
  bills: BillInsertWithoutNumber[];
  tokenMultibank?: string;
  queueId: number;
}) {
  if (!data.bills || !Array.isArray(data.bills) || data.bills.length === 0) {
    throw new Error('Bills array is required and must not be empty');
  }

  await billCreateQueue.add("create-bills", data);
}

// Tambahkan handler untuk shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    billConfirmWorker.close(),
    billCreateWorker.close()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await billConfirmWorker.close();
  process.exit(0);
});
