export type SessionStatus = "active" | "completed" | "on_lunch";

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
  createdAt: Date;
  updatedAt: Date;
}

export type CreateWorkSessionData = Omit<
  WorkSession,
  "id" | "createdAt" | "updatedAt"
>;
