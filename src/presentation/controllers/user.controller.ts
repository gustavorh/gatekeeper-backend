import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserWithRolesResponse } from '../../application/dto/response.dto';
import { User } from '../../domain/entities/user.entity';
import { UserProfileService } from '../../application/services/user-profile.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieve the current user profile with roles and permissions. Requires JWT authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserWithRolesResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error - User not found or database error',
  })
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
