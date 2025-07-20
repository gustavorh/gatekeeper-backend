import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Profile retrieved successfully',
      user: {
        id: user.sub,
        rut: user.rut,
        email: user.email,
      },
    };
  }
}
