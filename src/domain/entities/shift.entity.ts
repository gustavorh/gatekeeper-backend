export enum ShiftStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Shift {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  status: ShiftStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftDto {
  userId: string;
  clockInTime: Date;
}

export interface UpdateShiftDto {
  clockOutTime?: Date;
  status?: ShiftStatus;
}

export interface ShiftWithUser {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  status: ShiftStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    rut: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
