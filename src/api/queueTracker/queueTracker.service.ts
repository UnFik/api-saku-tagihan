import { db } from "@/db";
import { queueTracker } from "@/db/schema";
import type { QueueTrackerQuery } from "./queueTracker.schema";
import { and, desc, eq, or } from "drizzle-orm";
import { ResponseService } from "@/types";

export abstract class QueueTrackerService {
  static async getAll(): Promise<ResponseService> {
    try {
        const data = await db
          .select()
          .from(queueTracker)
          .orderBy(desc(queueTracker.id))
          .then(rows => rows.map(row => ({
            ...row,
            createdAt: new Date(row.createdAt).toLocaleString('id-ID', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\./g, ':'),
            updateAt: new Date(row.updateAt).toLocaleString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric', 
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\./g, ':')
          })));

        return {
            status: 200,
            success: true,
            message: "Berhasil mendapatkan data Tracker Antrian",
            data
        }
      
    } catch (error) {
      console.error("Error getting queue tracker data:", error);
      return {
        success: false,
        status: 500,
        message: "Gagal mendapatkan data antrian"
      };
    }
  }
}