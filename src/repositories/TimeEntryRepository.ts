import { injectable } from "inversify";
import { BaseRepository } from "./BaseRepository";
import { ITimeEntryRepository } from "./interfaces/ITimeEntryRepository";
import {
  TimeEntry,
  CreateTimeEntryData,
  EntryType,
} from "@/models/entities/TimeEntry";
import { timeEntries } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";

@injectable()
export class TimeEntryRepository
  extends BaseRepository<TimeEntry>
  implements ITimeEntryRepository
{
  constructor() {
    super(timeEntries, timeEntries.id);
  }

  async findByUserId(userId: number, limit = 10): Promise<TimeEntry[]> {
    try {
      const results = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.userId, userId))
        .orderBy(desc(timeEntries.timestamp))
        .limit(limit);

      return results as TimeEntry[];
    } catch (error) {
      console.error(`Error finding entries for user ${userId}:`, error);
      throw new Error("Failed to find entries by user");
    }
  }

  async findByUserIdAndDate(userId: number, date: Date): Promise<TimeEntry[]> {
    try {
      const dateStr = date.toISOString().split("T")[0];

      const results = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, userId),
            sql`DATE(${timeEntries.date}) = ${dateStr}`
          )
        )
        .orderBy(desc(timeEntries.timestamp));

      return results as TimeEntry[];
    } catch (error) {
      console.error(
        `Error finding entries for user ${userId} on date ${date}:`,
        error
      );
      throw new Error("Failed to find entries by user and date");
    }
  }

  async findLastEntryByUser(userId: number): Promise<TimeEntry | null> {
    try {
      const results = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.userId, userId))
        .orderBy(desc(timeEntries.timestamp))
        .limit(1);

      return results.length > 0 ? (results[0] as TimeEntry) : null;
    } catch (error) {
      console.error(`Error finding last entry for user ${userId}:`, error);
      throw new Error("Failed to find last entry by user");
    }
  }

  async findLastEntryByUserAndType(
    userId: number,
    entryType: EntryType
  ): Promise<TimeEntry | null> {
    try {
      const results = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, userId),
            eq(timeEntries.entryType, entryType)
          )
        )
        .orderBy(desc(timeEntries.timestamp))
        .limit(1);

      return results.length > 0 ? (results[0] as TimeEntry) : null;
    } catch (error) {
      console.error(
        `Error finding last entry for user ${userId} and type ${entryType}:`,
        error
      );
      throw new Error("Failed to find last entry by user and type");
    }
  }

  async createEntry(entryData: CreateTimeEntryData): Promise<TimeEntry> {
    return await this.create(entryData);
  }

  async getRecentActivities(userId: number, limit = 5): Promise<TimeEntry[]> {
    return await this.findByUserId(userId, limit);
  }
}
