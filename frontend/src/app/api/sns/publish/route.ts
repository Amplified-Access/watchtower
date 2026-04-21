import { NextRequest, NextResponse } from "next/server";
import { snsService } from "@/lib/aws/sns";
import { z } from "zod";

// Request validation schema
const publishMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  subject: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  type: z.enum(["custom", "incident", "system"]).default("custom"),
  // For incident alerts
  incidentData: z
    .object({
      id: z.string(),
      type: z.string(),
      description: z.string(),
      location: z.string().optional(),
      severity: z.string().optional(),
      organizationId: z.string().optional(),
    })
    .optional(),
  // For system alerts
  systemData: z
    .object({
      type: z.enum(["error", "warning", "info"]),
      title: z.string(),
      description: z.string(),
      source: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = publishMessageSchema.parse(body);

    let result;

    switch (validatedData.type) {
      case "incident":
        if (!validatedData.incidentData) {
          return NextResponse.json(
            {
              success: false,
              error: "Incident data is required for incident alerts",
            },
            { status: 400 }
          );
        }
        result = await snsService.publishIncidentAlert(
          validatedData.incidentData
        );
        break;

      case "system":
        if (!validatedData.systemData) {
          return NextResponse.json(
            {
              success: false,
              error: "System data is required for system alerts",
            },
            { status: 400 }
          );
        }
        result = await snsService.publishSystemAlert(validatedData.systemData);
        break;

      case "custom":
      default:
        result = await snsService.publishMessage({
          message: validatedData.message,
          subject: validatedData.subject,
          attributes: validatedData.attributes as Record<string, string>,
        });
        break;
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "Message published successfully to watchtower-alerts-topic",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "SNS publish endpoint",
    usage: "POST /api/sns/publish",
    topic: "watchtower-alerts-topic",
    examples: {
      custom: {
        message: "Hello from Watchtower!",
        subject: "Test Message",
        attributes: { priority: "high" },
        type: "custom",
      },
      incident: {
        type: "incident",
        incidentData: {
          id: "incident-123",
          type: "Violence Against Civilians",
          description: "Incident reported in Kampala",
          location: "Kampala, Uganda",
          severity: "high",
          organizationId: "org-123",
        },
      },
      system: {
        type: "system",
        systemData: {
          type: "error",
          title: "Database Connection Failed",
          description: "Unable to connect to database",
          source: "watchtower-backend",
        },
      },
    },
  });
}
