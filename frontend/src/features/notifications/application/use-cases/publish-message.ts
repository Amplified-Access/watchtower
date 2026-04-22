import { NotificationPublishError } from "../../domain/errors";
import type {
  NotificationPublisher,
  PublishMessageInput,
} from "../../domain/notification-publisher";

export class PublishMessage {
  constructor(private readonly publisher: NotificationPublisher) {}

  async execute(input: PublishMessageInput): Promise<{
    success: true;
    messageId?: string;
    message: string;
  }> {
    const result = await this.publisher.publishMessage(input);

    if (!result.success) {
      throw new NotificationPublishError(
        result.error || "Failed to publish message",
      );
    }

    return {
      success: true,
      messageId: result.messageId,
      message: "Message published successfully to watchtower-alerts-topic",
    };
  }
}
