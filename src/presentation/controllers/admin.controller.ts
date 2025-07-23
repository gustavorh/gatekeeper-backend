import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from '../../application/services/admin.service';
import { AdminAuthGuard } from '../middleware/admin-auth.guard';
import {
  CreateUserAdminDto,
  UpdateUserAdminDto,
  CreateRoleAdminDto,
  UpdateRoleAdminDto,
  CreatePermissionAdminDto,
  UpdatePermissionAdminDto,
  PaginationDto,
  UserListResponse,
  RoleListResponse,
  PermissionListResponse,
  UserResponseDto,
  RoleResponseDto,
  PermissionResponseDto,
} from '../../application/dto/admin.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

/**
 * Admin controller for managing users, roles, and permissions
 * Requires admin role authentication
 */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  }),
)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===================================
  // DASHBOARD ENDPOINTS
  // ===================================

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin dashboard data',
    description:
      'Retrieve system statistics and recent activities for admin dashboard. Admin role required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                totalUsers: { type: 'number' },
                activeUsers: { type: 'number' },
                totalShifts: { type: 'number' },
                activeShifts: { type: 'number' },
                totalRoles: { type: 'number' },
                totalPermissions: { type: 'number' },
              },
            },
            recentActivities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  userId: { type: 'string' },
                  userName: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
            topUsers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  totalShifts: { type: 'number' },
                  totalHours: { type: 'number' },
                },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  async getDashboardData() {
    try {
      return await this.adminService.getDashboardData();
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve dashboard data',
        error: error.message,
      });
    }
  }

  // ===================================
  // USER MANAGEMENT ENDPOINTS
  // ===================================

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Create a new user with optional role assignments. Admin role required.',
  })
  @ApiBody({
    type: CreateUserAdminDto,
    description: 'User creation data with optional role assignments',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or user already exists',
  })
  async createUser(
    @Body() createUserDto: CreateUserAdminDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.adminService.createUser(createUserDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'User creation failed',
        error: error.message,
      });
    }
  }

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users with pagination',
    description:
      'Retrieve all users with optional search and pagination. Admin role required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserListResponse,
  })
  async getUsers(
    @Query() paginationDto: PaginationDto,
  ): Promise<UserListResponse> {
    return await this.adminService.getUsers(paginationDto);
  }

  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return await this.adminService.getUserById(id);
  }

  @Get('users/:id/with-roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user with roles and permissions',
    description:
      'Retrieve a specific user with their roles and permissions. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'User with roles retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserWithRoles(@Param('id') id: string): Promise<any> {
    return await this.adminService.getUserWithRoles(id);
  }

  @Put('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update a user with optional role assignments. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({
    type: UpdateUserAdminDto,
    description: 'User update data with optional role assignments',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or user already exists',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserAdminDto,
  ): Promise<UserResponseDto> {
    try {
      return await this.adminService.updateUser(id, updateUserDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'User update failed',
        error: error.message,
      });
    }
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteUser(id);
  }

  // ===================================
  // ROLE MANAGEMENT ENDPOINTS
  // ===================================

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role',
    description:
      'Create a new role with optional permission assignments. Admin role required.',
  })
  @ApiBody({
    type: CreateRoleAdminDto,
    description: 'Role creation data with optional permission assignments',
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or role already exists',
  })
  async createRole(
    @Body() createRoleDto: CreateRoleAdminDto,
  ): Promise<RoleResponseDto> {
    try {
      return await this.adminService.createRole(createRoleDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Role creation failed',
        error: error.message,
      });
    }
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all roles with pagination',
    description:
      'Retrieve all roles with optional search and pagination. Admin role required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: RoleListResponse,
  })
  async getRoles(
    @Query() paginationDto: PaginationDto,
  ): Promise<RoleListResponse> {
    return await this.adminService.getRoles(paginationDto);
  }

  @Get('roles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Retrieve a specific role by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async getRoleById(@Param('id') id: string): Promise<RoleResponseDto> {
    return await this.adminService.getRoleById(id);
  }

  @Get('roles/:id/with-permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get role with permissions',
    description:
      'Retrieve a specific role with its permissions. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Role with permissions retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async getRoleWithPermissions(@Param('id') id: string): Promise<any> {
    return await this.adminService.getRoleWithPermissions(id);
  }

  @Put('roles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update role',
    description:
      'Update a role with optional permission assignments. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiBody({
    type: UpdateRoleAdminDto,
    description: 'Role update data with optional permission assignments',
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or role already exists',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleAdminDto,
  ): Promise<RoleResponseDto> {
    try {
      return await this.adminService.updateRole(id, updateRoleDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Role update failed',
        error: error.message,
      });
    }
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete role',
    description: 'Delete a role by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Role ID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async deleteRole(@Param('id') id: string): Promise<void> {
    await this.adminService.deleteRole(id);
  }

  // ===================================
  // PERMISSION MANAGEMENT ENDPOINTS
  // ===================================

  @Post('permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new permission',
    description: 'Create a new permission. Admin role required.',
  })
  @ApiBody({
    type: CreatePermissionAdminDto,
    description: 'Permission creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: PermissionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or permission already exists',
  })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionAdminDto,
  ): Promise<PermissionResponseDto> {
    try {
      return await this.adminService.createPermission(createPermissionDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Permission creation failed',
        error: error.message,
      });
    }
  }

  @Get('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all permissions with pagination',
    description:
      'Retrieve all permissions with optional search and pagination. Admin role required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    type: PermissionListResponse,
  })
  async getPermissions(
    @Query() paginationDto: PaginationDto,
  ): Promise<PermissionListResponse> {
    return await this.adminService.getPermissions(paginationDto);
  }

  @Get('permissions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permission by ID',
    description: 'Retrieve a specific permission by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Permission ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async getPermissionById(
    @Param('id') id: string,
  ): Promise<PermissionResponseDto> {
    return await this.adminService.getPermissionById(id);
  }

  @Put('permissions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update permission',
    description: 'Update a permission. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Permission ID', type: String })
  @ApiBody({
    type: UpdatePermissionAdminDto,
    description: 'Permission update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: PermissionResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation error or permission already exists',
  })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionAdminDto,
  ): Promise<PermissionResponseDto> {
    try {
      return await this.adminService.updatePermission(id, updatePermissionDto);
    } catch (error) {
      throw new BadRequestException({
        message: 'Permission update failed',
        error: error.message,
      });
    }
  }

  @Delete('permissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Delete a permission by ID. Admin role required.',
  })
  @ApiParam({ name: 'id', description: 'Permission ID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Permission deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async deletePermission(@Param('id') id: string): Promise<void> {
    await this.adminService.deletePermission(id);
  }
}
