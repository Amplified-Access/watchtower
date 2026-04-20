import { NotificationPublishError } from "../../domain/errors";
import type {
  NotificationPublisher,
  PublishIncidentAlertInput,
} from "../../domain/notification-publisher";

export class PublishIncidentAlert {
  constructor(private readonly publisher: NotificationPublisher) {}

  async execute(input: PublishIncidentAlertInput): Promise<{
    success: true;
    messageId?: string;
    message: string;
  }> {
    const result = await this.publisher.publishIncidentAlert(input);

    if (!result.success) {
      throw new NotificationPublishError(
        result.error || "Failed to publish incident alert",
      );
    }

    return {
      success: true,
      messageId: result.messageId,
      message: "Incident alert published successfully",
    };
  }
}
