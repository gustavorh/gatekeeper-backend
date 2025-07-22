import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  IAuthService,
  LoginDto,
  RegisterDto,
} from '../../domain/services/auth.service.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { AuthResponse } from '../dto/response.dto';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly jwtService: JwtService,
    private readonly userProfileService: UserProfileService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByRut(loginDto.rut);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      user.id,
    );

    if (!userWithRoles) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      user: userWithRoles,
      token,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUserByRut = await this.userRepository.findByRut(
      registerDto.rut,
    );

    if (existingUserByRut) {
      throw new ConflictException('User with this RUT already exists');
    }

    const existingUserByEmail = await this.userRepository.findByEmail(
      registerDto.email,
    );

    if (existingUserByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = await this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Asignar automáticamente el rol "user" al usuario registrado
    const userRole = await this.roleRepository.findByName('user');
    if (userRole) {
      await this.roleRepository.assignRoleToUser(user.id, userRole.id);
    }

    const token = this.generateToken(user);
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      user.id,
    );

    if (!userWithRoles) {
      throw new UnauthorizedException('User profile not found');
    }

    return {
      user: userWithRoles,
      token,
    };
  }

  async validateToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        return null;
      }

      return this.excludePassword(user);
    } catch {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      rut: user.rut,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
