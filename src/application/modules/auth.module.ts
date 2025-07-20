import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../../presentation/controllers/auth.controller';
import { UserController } from '../../presentation/controllers/user.controller';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserRepository,
    JwtAuthGuard,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
