import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserWithRolesResponse } from '../../application/dto/response.dto';
import { User } from '../../domain/entities/user.entity';
import { UserProfileService } from '../../application/services/user-profile.service';

@Controller('users')
export class UserController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<UserWithRolesResponse> {
    const userWithRoles = await this.userProfileService.getUserWithRoles(
      user.id,
    );

    if (!userWithRoles) {
      throw new Error('User not found');
    }

    return userWithRoles;
  }
}
