import type {
  DashboardStatsDTO,
  WeeklyStatsDTO,
  MonthlyStatsDTO,
  DashboardResponseDTO,
} from "@/models/dtos";

export interface IStatisticsService {
  // Dashboard statistics
  getDashboardStats(userId: number): Promise<DashboardStatsDTO>;

  // Weekly and monthly statistics
  getWeeklyStats(userId: number, date?: Date): Promise<WeeklyStatsDTO>;
  getMonthlyStats(userId: number, date?: Date): Promise<MonthlyStatsDTO>;

  // Calculation utilities
  calculateComplianceScore(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number>;
  calculateOvertimeHours(totalHours: number, regularHours?: number): number;

  // Time utilities
  getWeekStart(date?: Date): Date;
  getMonthStart(date?: Date): Date;
  getCurrentChileTime(): Date;
}
