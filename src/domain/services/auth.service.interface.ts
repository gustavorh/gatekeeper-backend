import { User } from '../entities/user.entity';
import { AuthResponse } from '../../application/dto/response.dto';

export interface LoginDto {
  rut: string;
  password: string;
}

export interface RegisterDto {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export interface IAuthService {
  login(loginDto: LoginDto): Promise<AuthResponse>;
  register(registerDto: RegisterDto): Promise<AuthResponse>;
  validateToken(token: string): Promise<Omit<User, 'password'> | null>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}
