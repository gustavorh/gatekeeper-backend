// Símbolos para inyección de dependencias
export const TYPES = {
  // Repositories
  UserRepository: Symbol.for("UserRepository"),
  TimeEntryRepository: Symbol.for("TimeEntryRepository"),
  WorkSessionRepository: Symbol.for("WorkSessionRepository"),
  RoleRepository: Symbol.for("RoleRepository"),

  // Services
  AuthService: Symbol.for("AuthService"),
  TimeTrackingService: Symbol.for("TimeTrackingService"),
  UserService: Symbol.for("UserService"),
  RoleService: Symbol.for("RoleService"),
  StatisticsService: Symbol.for("StatisticsService"),

  // Controllers
  AuthController: Symbol.for("AuthController"),
  TimeController: Symbol.for("TimeController"),
  AdminController: Symbol.for("AdminController"),
  StatisticsController: Symbol.for("StatisticsController"),

  // Utils
  DateUtils: Symbol.for("DateUtils"),
  ValidationUtils: Symbol.for("ValidationUtils"),
} as const;

// Interfaces base
export interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(entity: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

// Tipos de respuesta API estándar
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Tipos de filtros comunes
export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export interface PaginationFilter {
  page?: number;
  limit?: number;
}
