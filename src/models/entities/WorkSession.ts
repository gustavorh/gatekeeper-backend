export type SessionStatus =
  | "active"
  | "completed"
  | "on_lunch"
  | "overtime_pending";

export interface WorkSession {
  id: number;
  userId: number;
  date: Date;
  status: SessionStatus;
  clockInTime?: Date | null;
  clockOutTime?: Date | null;
  lunchStartTime?: Date | null;
  lunchEndTime?: Date | null;
  totalWorkMinutes: number;
  totalLunchMinutes: number;
  totalWorkHours: string;
  isOvertimeDay?: boolean;
  overtimeMinutes?: number;
  isValidSession: boolean;
  validationErrors?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWorkSessionData = Omit<
  WorkSession,
  "id" | "createdAt" | "updatedAt" | "isValidSession" | "validationErrors"
> & {
  isValidSession?: boolean;
  validationErrors?: string[] | null;
};
