import { injectable } from "inversify";
import { BaseRepository } from "./BaseRepository";
import { IWorkSessionRepository } from "./interfaces/IWorkSessionRepository";
import {
  WorkSession,
  CreateWorkSessionData,
} from "@/models/entities/WorkSession";
import { workSessions } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { PaginatedResponse, DateFilter, PaginationFilter } from "@/types";

@injectable()
export class WorkSessionRepository
  extends BaseRepository<WorkSession>
  implements IWorkSessionRepository
{
  constructor() {
    super(workSessions, workSessions.id);
  }

  async findByUserId(
    userId: number,
    options?: PaginationFilter & DateFilter
  ): Promise<PaginatedResponse<WorkSession>> {
    try {
      const page = options?.page || 1;
      const limit = Math.min(options?.limit || 10, 100);
      const offset = (page - 1) * limit;

      // Construir condiciones base
      let whereConditions = [eq(workSessions.userId, userId)];

      // Añadir filtros de fecha si se proporcionan
      if (options?.startDate) {
        whereConditions.push(
          sql`DATE(${workSessions.date}) >= ${options.startDate}`
        );
      }
      if (options?.endDate) {
        whereConditions.push(
          sql`DATE(${workSessions.date}) <= ${options.endDate}`
        );
      }

      // Contar total de sesiones
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(workSessions)
        .where(and(...whereConditions));

      const total = totalResult[0].count;
      const totalPages = Math.ceil(total / limit);

      // Obtener sesiones paginadas
      const sessions = await db
        .select()
        .from(workSessions)
        .where(and(...whereConditions))
        .orderBy(desc(workSessions.date))
        .limit(limit)
        .offset(offset);

      return {
        data: sessions as WorkSession[],
        total,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      console.error(`Error finding sessions for user ${userId}:`, error);
      throw new Error("Failed to find sessions by user");
    }
  }

  async findByUserIdAndDate(
    userId: number,
    date: Date
  ): Promise<WorkSession | null> {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const results = await db
        .select()
        .from(workSessions)
        .where(
          and(
            eq(workSessions.userId, userId),
            sql`${workSessions.date} = ${dateStr}`
          )
        )
        .limit(1);

      return results.length > 0 ? (results[0] as WorkSession) : null;
    } catch (error) {
      console.error(
        `Error al buscar sesión para el usuario ${userId} en la fecha ${date}:`,
        error
      );
      throw new Error("Error al buscar sesión por usuario y fecha");
    }
  }

  async findTodaySession(userId: number): Promise<WorkSession | null> {
    const today = new Date();
    return await this.findByUserIdAndDate(userId, today);
  }

  async createSession(
    sessionData: CreateWorkSessionData
  ): Promise<WorkSession> {
    return await this.create(sessionData);
  }

  async updateSessionTotals(
    sessionId: number,
    totals: {
      totalWorkMinutes: number;
      totalLunchMinutes: number;
      totalWorkHours: string;
    }
  ): Promise<void> {
    try {
      await db
        .update(workSessions)
        .set(totals)
        .where(eq(workSessions.id, sessionId));
    } catch (error) {
      console.error(
        `Error updating session totals for session ${sessionId}:`,
        error
      );
      throw new Error("Failed to update session totals");
    }
  }
}
