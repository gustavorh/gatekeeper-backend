import { Shift, ShiftWithUser } from '../entities/shift.entity';

export interface IShiftService {
  clockIn(userId: string): Promise<Shift>;
  clockOut(userId: string): Promise<Shift>;
  getCurrentShift(userId: string): Promise<Shift | null>;
  getShiftHistory(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    shifts: ShiftWithUser[];
    total: number;
  }>;
  validateClockIn(userId: string): Promise<boolean>;
  validateClockOut(userId: string): Promise<boolean>;
}
