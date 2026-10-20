"use client";

import { useState } from "react";
import { trpc } from "@/_trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Globe, Mail, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function OrganizationsPage() {
  const t = useTranslations("Organizations");
  const tNav = useTranslations("Navigation");
  const tCommon = useTranslations("Common");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  // Fetch organizations
  const {
    data: organizationsData,
    isLoading: organizationsLoading,
    error: organizationsError,
  } = trpc.getPublicOrganizations.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
    search: searchTerm || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page when searching
  };

  if (organizationsError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            {t("errorTitle")}
          </h1>
          <p className="text-muted-foreground">{t("errorLoading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {tNav("organizations")}
        </h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">{tCommon("search")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {organizationsData && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t("resultsSummary", {
              shown: organizationsData.data.length,
              total: organizationsData.total,
            })}
          </p>
        </div>
      )}

      {/* Organizations Grid */}
      {organizationsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-80">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : organizationsData?.data.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h3>
          <p className="text-muted-foreground">
            {searchTerm ? t("emptyNoMatch") : t("emptyNoOrganizations")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizationsData?.data.map((organization) => (
            <Card
              key={organization.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {organization.name}
                    </CardTitle>
                    {organization.description && (
                      <CardDescription className="line-clamp-2">
                        {organization.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organization.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{organization.location}</span>
                    </div>
                  )}

                  {organization.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a
                        href={`https://${organization.website.replace(
                          /^https?:\/\//,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {organization.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}

                  {organization.contactEmail && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a
                        href={`mailto:${organization.contactEmail}`}
                        className="text-blue-600 hover:underline truncate"
                      >
                        {organization.contactEmail}
                      </a>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link href={`/organizations/${organization.slug}`}>
                      <Button variant="outline" className="w-full">
                        {t("viewDetails")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {organizationsData && organizationsData.total > pageSize && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pageOf", {
              current: currentPage + 1,
              total: Math.ceil(organizationsData.total / pageSize),
            })}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!(organizationsData.data.length >= pageSize)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
