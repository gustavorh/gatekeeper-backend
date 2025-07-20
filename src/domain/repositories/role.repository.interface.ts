import { Role, CreateRoleDto, UpdateRoleDto } from '../entities/role.entity';

export interface IRoleRepository {
  create(role: CreateRoleDto): Promise<Role>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  update(id: string, role: UpdateRoleDto): Promise<Role>;
  delete(id: string): Promise<void>;
}
