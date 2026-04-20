import type { NotificationPublisher } from "../../domain/notification-publisher";
import { PublishMessage } from "./publish-message";

export class TestNotificationConnection {
  constructor(private readonly publisher: NotificationPublisher) {}

  async execute() {
    const publishMessage = new PublishMessage(this.publisher);

    const result = await publishMessage.execute({
      message: "Test message from Watchtower application",
      subject: "SNS Connection Test",
      attributes: {
        test: "true",
        source: "watchtower-trpc",
      },
    });

    return {
      ...result,
      message: "SNS connection test successful",
    };
  }
}
