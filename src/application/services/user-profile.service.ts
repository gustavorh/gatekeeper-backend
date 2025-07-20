import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { User } from '../../domain/entities/user.entity';
import {
  UserWithRolesResponse,
  RoleResponse,
  PermissionResponse,
} from '../dto/response.dto';

@Injectable()
export class UserProfileService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async getUserWithRoles(
    userId: string,
  ): Promise<UserWithRolesResponse | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    // Obtener roles del usuario
    const userRoles = await this.roleRepository.findUserRoles(userId);

    // Para cada rol, obtener sus permisos
    const rolesWithPermissions: RoleResponse[] = await Promise.all(
      userRoles.map(async (role) => {
        const permissions =
          await this.permissionRepository.findPermissionsByRole(role.id);

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
          permissions: permissions.map((permission) => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            isActive: permission.isActive,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
          })),
        };
      }),
    );

    return {
      id: user.id,
      rut: user.rut,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: rolesWithPermissions,
    };
  }
}
