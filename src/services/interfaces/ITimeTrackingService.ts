import type {
  ClockActionResponseDTO,
  ClockActionRequestDTO,
  CurrentStatusResponseDTO,
  SessionSummaryDTO,
  ActivityDTO,
  SessionsResponseDTO,
  TodaySessionResponseDTO,
} from "@/models/dtos";
import type { ButtonStatesDTO } from "@/models/dtos/time.dto";

export interface ITimeTrackingService {
  // Clock actions
  clockIn(userId: number, timestamp?: Date): Promise<ClockActionResponseDTO>;
  clockOut(userId: number, timestamp?: Date): Promise<ClockActionResponseDTO>;
  startLunch(userId: number, timestamp?: Date): Promise<ClockActionResponseDTO>;
  resumeShift(
    userId: number,
    timestamp?: Date
  ): Promise<ClockActionResponseDTO>;

  // Status and sessions
  getCurrentStatus(
    userId: number,
    currentTime?: Date
  ): Promise<CurrentStatusResponseDTO>;
  getTodaySession(
    userId: number,
    currentTime?: Date
  ): Promise<TodaySessionResponseDTO>;
  getSessionSummary(
    userId: number,
    date?: Date
  ): Promise<SessionSummaryDTO | null>;

  // Activities and history
  getRecentActivities(userId: number, limit?: number): Promise<ActivityDTO[]>;
  getUserSessions(
    userId: number,
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string
  ): Promise<SessionsResponseDTO>;

  // Button states
  getButtonStates(userId: number, currentTime?: Date): Promise<ButtonStatesDTO>;
}
