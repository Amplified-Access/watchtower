export interface PublishMessageInput {
  message: string;
  subject?: string;
  attributes?: Record<string, string>;
}

export interface PublishIncidentAlertInput {
  id: string;
  type: string;
  description: string;
  location?: string | { lat: number; lon: number };
  severity?: string;
  organizationId?: string;
}

export interface PublishSystemAlertInput {
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  source?: string;
}

export interface NotificationPublishResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationPublisher {
  publishMessage(input: PublishMessageInput): Promise<NotificationPublishResult>;
  publishIncidentAlert(
    input: PublishIncidentAlertInput,
  ): Promise<NotificationPublishResult>;
  publishSystemAlert(
    input: PublishSystemAlertInput,
  ): Promise<NotificationPublishResult>;
}
