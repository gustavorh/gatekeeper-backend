export type EntryType =
  | "clock_in"
  | "clock_out"
  | "start_lunch"
  | "resume_shift";

export interface TimeEntry {
  id: number;
  userId: number;
  entryType: EntryType;
  timestamp: Date;
  date: Date;
  isValid: boolean;
  validationNotes?: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTimeEntryData = Omit<
  TimeEntry,
  "id" | "createdAt" | "updatedAt"
>;
