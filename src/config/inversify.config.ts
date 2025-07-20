import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "@/types";

// Import interfaces
import type { IUserRepository } from "@/repositories/interfaces/IUserRepository";
import type { ITimeEntryRepository } from "@/repositories/interfaces/ITimeEntryRepository";
import type { IWorkSessionRepository } from "@/repositories/interfaces/IWorkSessionRepository";
import type { IRoleRepository } from "@/repositories/interfaces/IRoleRepository";

import type { IAuthService } from "@/services/interfaces/IAuthService";
import type { ITimeTrackingService } from "@/services/interfaces/ITimeTrackingService";
import type { IUserService } from "@/services/interfaces/IUserService";
import type { IStatisticsService } from "@/services/interfaces/IStatisticsService";
import type { IAdminWorkSessionService } from "@/services/interfaces/IAdminWorkSessionService";
import type { IPermissionService } from "@/services/interfaces/IPermissionService";

import type { IDateUtils } from "@/utils/interfaces/IDateUtils";
import type { IValidationUtils } from "@/utils/interfaces/IValidationUtils";

// Import implementations
import { UserRepository } from "@/repositories/UserRepository";
import { TimeEntryRepository } from "@/repositories/TimeEntryRepository";
import { WorkSessionRepository } from "@/repositories/WorkSessionRepository";
import { RoleRepository } from "@/repositories/RoleRepository";

import { AuthService } from "@/services/AuthService";
import { TimeTrackingService } from "@/services/TimeTrackingService";
import { UserService } from "@/services/UserService";
import { StatisticsService } from "@/services/StatisticsService";
import { AdminWorkSessionService } from "@/services/AdminWorkSessionService";
import { PermissionService } from "@/services/PermissionService";

import { AuthController } from "@/controllers/AuthController";
import { TimeController } from "@/controllers/TimeController";
import { AdminController } from "@/controllers/AdminController";
import { StatisticsController } from "@/controllers/StatisticsController";
import { AdminWorkSessionController } from "@/controllers/AdminWorkSessionController";
import { PermissionController } from "@/controllers/PermissionController";

import { DateUtils } from "@/utils/DateUtils";
import { ValidationUtils } from "@/utils/ValidationUtils";

// Crear contenedor
const container = new Container();

// Bind repositories
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container
  .bind<ITimeEntryRepository>(TYPES.TimeEntryRepository)
  .to(TimeEntryRepository);
container
  .bind<IWorkSessionRepository>(TYPES.WorkSessionRepository)
  .to(WorkSessionRepository);
container.bind<IRoleRepository>(TYPES.RoleRepository).to(RoleRepository);

// Bind services
container.bind<IAuthService>(TYPES.AuthService).to(AuthService);
container
  .bind<ITimeTrackingService>(TYPES.TimeTrackingService)
  .to(TimeTrackingService);
container.bind<IUserService>(TYPES.UserService).to(UserService);
container
  .bind<IStatisticsService>(TYPES.StatisticsService)
  .to(StatisticsService);
container
  .bind<IAdminWorkSessionService>(TYPES.AdminWorkSessionService)
  .to(AdminWorkSessionService);
container
  .bind<IPermissionService>(TYPES.PermissionService)
  .to(PermissionService);

// Bind controllers
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<TimeController>(TYPES.TimeController).to(TimeController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container
  .bind<StatisticsController>(TYPES.StatisticsController)
  .to(StatisticsController);
container
  .bind<AdminWorkSessionController>(TYPES.AdminWorkSessionController)
  .to(AdminWorkSessionController);
container
  .bind<PermissionController>(TYPES.PermissionController)
  .to(PermissionController);

// Bind utils
container.bind<IDateUtils>(TYPES.DateUtils).to(DateUtils);
container.bind<IValidationUtils>(TYPES.ValidationUtils).to(ValidationUtils);

export { container };
