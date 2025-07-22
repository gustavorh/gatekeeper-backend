import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RegisterDto } from '../../application/dto/auth.dto';
import { AuthResponse } from '../../application/dto/response.dto';

/**
 * Authentication controller
 * Handles user login and registration with proper validation at presentation layer
 */
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login endpoint
   * Validates input using LoginDto at presentation layer
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  /**
   * User registration endpoint
   * Validates input using RegisterDto at presentation layer
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Registration failed',
        error: error.message,
      });
    }
  }
}
