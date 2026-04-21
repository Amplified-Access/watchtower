import { GetActiveFormsForWatcher } from "../application/use-cases/get-active-forms-for-watcher";
import { GetAdminOrganization } from "../application/use-cases/get-admin-organization";
import { GetFormById } from "../application/use-cases/get-form-by-id";
import { GetOrganizationDashboardStats } from "../application/use-cases/get-organization-dashboard-stats";
import { GetOrganizationRecentActivity } from "../application/use-cases/get-organization-recent-activity";
import { SubmitIncident } from "../application/use-cases/submit-incident";
import type { WatcherRepository } from "../domain/watcher-repository";
import { DrizzleWatcherRepository } from "./repositories/drizzle-watcher-repository";

export interface WatcherUseCases {
  getAdminOrganization: GetAdminOrganization;
  getFormById: GetFormById;
  getActiveFormsForWatcher: GetActiveFormsForWatcher;
  submitIncident: SubmitIncident;
  getOrganizationDashboardStats: GetOrganizationDashboardStats;
  getOrganizationRecentActivity: GetOrganizationRecentActivity;
}

export const createWatcherUseCases = (
  repository: WatcherRepository = new DrizzleWatcherRepository(),
): WatcherUseCases => {
  return {
    getAdminOrganization: new GetAdminOrganization(repository),
    getFormById: new GetFormById(repository),
    getActiveFormsForWatcher: new GetActiveFormsForWatcher(repository),
    submitIncident: new SubmitIncident(repository),
    getOrganizationDashboardStats: new GetOrganizationDashboardStats(
      repository,
    ),
    getOrganizationRecentActivity: new GetOrganizationRecentActivity(
      repository,
    ),
  };
};
