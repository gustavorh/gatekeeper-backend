import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftWithUser,
} from '../entities/shift.entity';

export interface IShiftRepository {
  create(createShiftDto: CreateShiftDto): Promise<Shift>;
  findById(id: string): Promise<Shift | null>;
  findByUserId(userId: string): Promise<Shift[]>;
  findActiveByUserId(userId: string): Promise<Shift | null>;
  findPendingByUserId(userId: string): Promise<Shift | null>;
  update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift>;
  delete(id: string): Promise<void>;
  findWithUser(id: string): Promise<ShiftWithUser | null>;
  findHistoryByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ShiftWithUser[]>;
  findHistoryByUserIdWithoutUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Shift[]>;
  countByUserId(userId: string): Promise<number>;
}
