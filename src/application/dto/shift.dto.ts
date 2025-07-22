import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for clock-in request
 * No body required - user ID is extracted from JWT token
 */
export class ClockInDto {
  // Empty DTO - user ID comes from JWT token
}

/**
 * DTO for clock-out request
 * No body required - user ID is extracted from JWT token
 */
export class ClockOutDto {
  // Empty DTO - user ID comes from JWT token
}

/**
 * DTO for shift history request
 */
export class ShiftHistoryDto {
  @ApiProperty({
    description: 'User ID for the shift history',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  @ApiProperty({
    description: 'Number of shifts to return',
    example: 10,
    required: false,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Number of shifts to skip',
    example: 0,
    required: false,
  })
  @IsOptional()
  offset?: number;
}

/**
 * DTO for shift response
 */
export class ShiftResponseDto {
  @ApiProperty({
    description: 'Shift ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Clock in time',
    example: '2024-01-01T08:00:00.000Z',
  })
  clockInTime: Date;

  @ApiProperty({
    description: 'Clock out time',
    example: '2024-01-01T17:00:00.000Z',
    required: false,
  })
  clockOutTime?: Date;

  @ApiProperty({
    description: 'Shift status',
    example: 'active',
    enum: ['pending', 'active', 'completed'],
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T08:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T08:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * DTO for shift with user information
 */
export class ShiftWithUserResponseDto extends ShiftResponseDto {
  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    rut: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * DTO for shift history response
 */
export class ShiftHistoryResponseDto {
  @ApiProperty({
    description: 'List of shifts',
    type: [ShiftResponseDto],
  })
  shifts: ShiftResponseDto[];

  @ApiProperty({
    description: 'Total number of shifts',
    example: 25,
  })
  total: number;
}
