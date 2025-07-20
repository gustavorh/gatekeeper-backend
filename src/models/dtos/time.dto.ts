import { WorkSession, TimeEntry, EntryType } from "../entities";

// Clock Action DTOs
export interface ClockActionRequestDTO {
  timestamp?: string;
}

// Simplified response DTO - no more validation handling
export interface ClockActionResponseDTO {
  session: WorkSession;
  entry: TimeEntry;
  buttonStates: ButtonStatesDTO;
}

// Button States DTO
export interface ButtonStateDTO {
  enabled: boolean;
  reason?: string;
}

export interface ButtonStatesDTO {
  clockIn: ButtonStateDTO;
  clockOut: ButtonStateDTO;
  startLunch: ButtonStateDTO;
  resumeShift: ButtonStateDTO;
}

// Current Status DTO
export interface CurrentStatusResponseDTO {
  status: "clocked_out" | "clocked_in" | "on_lunch";
  session?: WorkSession;
  buttonStates: ButtonStatesDTO;
  canClockIn: boolean;
  canClockOut: boolean;
  canStartLunch: boolean;
  canResumeShift: boolean;
  restrictions: string[];
}

// Session Summary DTO
export interface SessionSummaryDTO {
  session: WorkSession;
  totalWorkedHours: number;
  totalLunchMinutes: number;
  currentStatus: "clocked_out" | "clocked_in" | "on_lunch";
  canClockIn: boolean;
  canClockOut: boolean;
  canStartLunch: boolean;
  canResumeShift: boolean;
}

// Today Session Response DTO
export interface TodaySessionResponseDTO {
  session: WorkSession | null;
  workedHours: number;
  lunchDuration: number;
  remainingHours: number;
  status: "clocked_out" | "clocked_in" | "on_lunch";
  canClockIn?: boolean;
  canClockOut?: boolean;
  canStartLunch?: boolean;
  canResumeShift?: boolean;
}

// Recent Activities DTO
export interface ActivityDTO {
  id: number;
  type: EntryType;
  timestamp: Date;
  date: Date;
  timezone: string;
  isValid: boolean;
}

export interface RecentActivitiesResponseDTO {
  activities: ActivityDTO[];
}

// Sessions List DTO
export interface SessionsRequestDTO {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface SessionsResponseDTO {
  sessions: WorkSession[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}
