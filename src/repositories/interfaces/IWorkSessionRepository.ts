import { IRepository } from "@/types";
import {
  WorkSession,
  CreateWorkSessionData,
} from "@/models/entities/WorkSession";
import { PaginatedResponse, DateFilter, PaginationFilter } from "@/types";

export interface IWorkSessionRepository extends IRepository<WorkSession> {
  findByUserId(
    userId: number,
    options?: PaginationFilter & DateFilter
  ): Promise<PaginatedResponse<WorkSession>>;
  findByUserIdAndDate(userId: number, date: Date): Promise<WorkSession | null>;
  findTodaySession(userId: number): Promise<WorkSession | null>;
  createSession(sessionData: CreateWorkSessionData): Promise<WorkSession>;
  updateSessionTotals(
    sessionId: number,
    totals: {
      totalWorkMinutes: number;
      totalLunchMinutes: number;
      totalWorkHours: string;
    }
  ): Promise<void>;
}
