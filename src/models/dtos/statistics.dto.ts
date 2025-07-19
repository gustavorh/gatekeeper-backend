// Dashboard Statistics DTOs
export interface DashboardStatsDTO {
  weekStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  monthStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  averageEntryTime: string;
  averageExitTime: string;
  averageLunchDuration: number;
  complianceScore: number;
}

export interface WeeklyStatsDTO {
  weekStartDate: string;
  totalHours: number;
  totalDays: number;
  overtimeHours: number;
  sessions: Array<{
    date: string;
    totalWorkHours: number;
    totalLunchMinutes: number;
    status: string;
  }>;
}

export interface MonthlyStatsDTO {
  monthStartDate: string;
  totalHours: number;
  totalDays: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  complianceScore: number;
}

export interface DashboardResponseDTO {
  weekStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  monthStats: {
    totalHours: number;
    totalDays: number;
    overtimeHours: number;
  };
  averageEntryTime: string;
  averageExitTime: string;
  averageLunchDuration: number;
  complianceScore: number;
}
