import { PublishIncidentAlert } from "../application/use-cases/publish-incident-alert";
import { PublishMessage } from "../application/use-cases/publish-message";
import { PublishSystemAlert } from "../application/use-cases/publish-system-alert";
import { TestNotificationConnection } from "../application/use-cases/test-notification-connection";
import type { NotificationPublisher } from "../domain/notification-publisher";
import { SnsNotificationPublisher } from "./publishers/sns-notification-publisher";

export interface NotificationUseCases {
  publishMessage: PublishMessage;
  publishIncidentAlert: PublishIncidentAlert;
  publishSystemAlert: PublishSystemAlert;
  testConnection: TestNotificationConnection;
}

export const createNotificationUseCases = (
  publisher: NotificationPublisher = new SnsNotificationPublisher(),
): NotificationUseCases => {
  return {
    publishMessage: new PublishMessage(publisher),
    publishIncidentAlert: new PublishIncidentAlert(publisher),
    publishSystemAlert: new PublishSystemAlert(publisher),
    testConnection: new TestNotificationConnection(publisher),
  };
};
