import { IRepository } from "@/types";
import {
  TimeEntry,
  CreateTimeEntryData,
  EntryType,
} from "@/models/entities/TimeEntry";

export interface ITimeEntryRepository extends IRepository<TimeEntry> {
  findByUserId(userId: number, limit?: number): Promise<TimeEntry[]>;
  findByUserIdAndDate(userId: number, date: Date): Promise<TimeEntry[]>;
  findLastEntryByUser(userId: number): Promise<TimeEntry | null>;
  findLastEntryByUserAndType(
    userId: number,
    entryType: EntryType
  ): Promise<TimeEntry | null>;
  createEntry(entryData: CreateTimeEntryData): Promise<TimeEntry>;
  getRecentActivities(userId: number, limit?: number): Promise<TimeEntry[]>;
}
