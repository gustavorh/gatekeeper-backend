import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsRut } from '../decorators/is-rut.decorator';
import { RutValidator } from '../../utils/rut-validator';

/**
 * DTO for user login
 * Enforces validation at the presentation layer
 */
export class LoginDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return RutValidator.normalize(value);
    }
    return value;
  })
  @IsRut({
    message:
      'RUT must have a valid format (e.g., 123456789 or 12345678-9) and correct verification digit',
  })
  @IsNotEmpty({ message: 'RUT is required' })
  rut: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;
}

/**
 * DTO for user registration
 * Enforces validation at the presentation layer
 */
export class RegisterDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return RutValidator.normalize(value);
    }
    return value;
  })
  @IsRut({
    message:
      'RUT must have a valid format (e.g., 123456789 or 12345678-9) and correct verification digit',
  })
  @IsNotEmpty({ message: 'RUT is required' })
  rut: string;

  @IsEmail({}, { message: 'Email must have a valid format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  lastName: string;
}
