import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ShiftService } from '../services/shift.service';
import { ShiftRepository } from '../../infrastructure/repositories/shift.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { ShiftController } from '../../presentation/controllers/shift.controller';
import { JwtAuthGuard } from '../../presentation/middleware/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ShiftController],
  providers: [
    ShiftService,
    ShiftRepository,
    UserRepository,
    JwtAuthGuard,
    {
      provide: 'IShiftRepository',
      useClass: ShiftRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [ShiftService],
})
export class ShiftModule {}
