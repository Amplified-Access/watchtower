"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/_trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Globe, Mail, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrganizationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Fetch organization by slug
  const {
    data: organization,
    isLoading,
    error,
  } = trpc.getOrganizationBySlug.useQuery({ slug });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Organization Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            The organization you're looking for doesn't exist or has been
            removed.
          </p>
          <Link href="/organizations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-32" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/organizations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
      </div>

      {/* Organization Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {organization.name}
              </CardTitle>
              {organization.description && (
                <CardDescription className="text-base">
                  {organization.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>

              {organization.location && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                  <span>{organization.location}</span>
                </div>
              )}

              {organization.website && (
                <div className="flex items-center text-sm">
                  <Globe className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                  <a
                    href={
                      organization.website.startsWith("http")
                        ? organization.website
                        : `https://${organization.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {organization.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {organization.contactEmail && (
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${organization.contactEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {organization.contactEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Organization Details</h3>

              <div className="flex items-center text-sm">
                <Building2 className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                <span>
                  Member since{" "}
                  {new Date(organization.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About {organization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {organization.description ? (
            <p className="text-muted-foreground leading-relaxed">
              {organization.description}
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              No detailed description available for this organization.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
