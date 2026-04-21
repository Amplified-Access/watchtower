import { snsService } from "@/lib/aws/sns";
import type {
  NotificationPublishResult,
  NotificationPublisher,
  PublishIncidentAlertInput,
  PublishMessageInput,
  PublishSystemAlertInput,
} from "../../domain/notification-publisher";

export class SnsNotificationPublisher implements NotificationPublisher {
  async publishMessage(
    input: PublishMessageInput,
  ): Promise<NotificationPublishResult> {
    return snsService.publishMessage(input);
  }

  async publishIncidentAlert(
    input: PublishIncidentAlertInput,
  ): Promise<NotificationPublishResult> {
    return snsService.publishIncidentAlert(input);
  }

  async publishSystemAlert(
    input: PublishSystemAlertInput,
  ): Promise<NotificationPublishResult> {
    return snsService.publishSystemAlert(input);
  }
}
