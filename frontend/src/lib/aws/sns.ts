import {
  SNSClient,
  PublishCommand,
  PublishCommandOutput,
} from "@aws-sdk/client-sns";

export interface SNSPublishParams {
  message: string;
  subject?: string;
  attributes?: Record<string, string>;
}

export interface SNSPublishResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SNSService {
  private client: SNSClient;
  private topicArn: string;

  constructor() {
    // Initialize SNS client with configuration
    this.client = new SNSClient({
      region: process.env.AWS_REGION || "eu-north-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.topicArn = process.env.AWS_SNS_TOPIC_ARN!;

    // Validate required environment variables
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured");
    }

    if (!this.topicArn) {
      throw new Error("AWS_SNS_TOPIC_ARN environment variable is not set");
    }
  }

  /**
   * Publish a message to the watchtower-alerts-topic
   */
  async publishMessage({
    message,
    subject,
    attributes = {},
  }: SNSPublishParams): Promise<SNSPublishResult> {
    try {
      // Add default attributes
      const messageAttributes = {
        source: {
          DataType: "String",
          StringValue: "watchtower-app",
        },
        timestamp: {
          DataType: "String",
          StringValue: new Date().toISOString(),
        },
        ...Object.entries(attributes).reduce((acc, [key, value]) => {
          acc[key] = {
            DataType: "String",
            StringValue: value,
          };
          return acc;
        }, {} as any),
      };

      const command = new PublishCommand({
        TopicArn: this.topicArn,
        Message: message,
        Subject: subject,
        MessageAttributes: messageAttributes,
      });

      const response: PublishCommandOutput = await this.client.send(command);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      console.error("SNS publish error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Publish an incident alert
   */
  async publishIncidentAlert(incidentData: {
    id: string;
    type: string;
    description: string;
    location?: string | { lat: number; lon: number };
    severity?: string;
    organizationId?: string;
  }): Promise<SNSPublishResult> {
    // Format location data - if it's an object with lat/lon, send coordinates
    let formattedLocation = incidentData.location;
    if (typeof incidentData.location === "object" && incidentData.location) {
      formattedLocation = {
        lat: incidentData.location.lat,
        lon: incidentData.location.lon,
      };
    }

    const message = JSON.stringify({
      eventType: "incident_reported",
      incidentId: incidentData.id,
      incidentType: incidentData.type,
      description: incidentData.description,
      location: formattedLocation,
      severity: incidentData.severity || "medium",
      organizationId: incidentData.organizationId,
      timestamp: new Date().toISOString(),
    });

    return this.publishMessage({
      message,
      subject: `New Incident Alert: ${incidentData.type}`,
      attributes: {
        eventType: "incident_reported",
        incidentType: incidentData.type,
        severity: incidentData.severity || "medium",
      },
    });
  }

  /**
   * Publish a system alert
   */
  async publishSystemAlert(alertData: {
    type: "error" | "warning" | "info";
    title: string;
    description: string;
    source?: string;
  }): Promise<SNSPublishResult> {
    const message = JSON.stringify({
      eventType: "system_alert",
      alertType: alertData.type,
      title: alertData.title,
      description: alertData.description,
      source: alertData.source || "watchtower-app",
      timestamp: new Date().toISOString(),
    });

    return this.publishMessage({
      message,
      subject: `System Alert: ${alertData.title}`,
      attributes: {
        eventType: "system_alert",
        alertType: alertData.type,
        source: alertData.source || "watchtower-app",
      },
    });
  }
}

// Export singleton instance
export const snsService = new SNSService();

// Export types and class for testing
export { SNSService };
