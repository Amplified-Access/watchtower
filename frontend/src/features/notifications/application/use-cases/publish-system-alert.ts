import { NotificationPublishError } from "../../domain/errors";
import type {
  NotificationPublisher,
  PublishSystemAlertInput,
} from "../../domain/notification-publisher";

export class PublishSystemAlert {
  constructor(private readonly publisher: NotificationPublisher) {}

  async execute(input: PublishSystemAlertInput): Promise<{
    success: true;
    messageId?: string;
    message: string;
  }> {
    const result = await this.publisher.publishSystemAlert(input);

    if (!result.success) {
      throw new NotificationPublishError(
        result.error || "Failed to publish system alert",
      );
    }

    return {
      success: true,
      messageId: result.messageId,
      message: "System alert published successfully",
    };
  }
}
