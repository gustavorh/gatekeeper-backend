import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { IsRut } from '../decorators/is-rut.decorator';

export class LoginDto {
  @IsRut()
  @IsNotEmpty()
  rut: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsRut()
  @IsNotEmpty()
  rut: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
