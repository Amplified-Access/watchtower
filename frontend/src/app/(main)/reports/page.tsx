"use client";

import { useState } from "react";
import { trpc } from "@/_trpc/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  Search,
  Calendar,
  Building,
  MapPin,
  Globe,
} from "lucide-react";
import { downloadReport } from "@/utils/file-download";
import TextComponent from "@/components/common/text-component";
import Container from "@/components/common/container";
import H4 from "@/components/common/heading-four";
import Loader from "@/components/common/loader";
import { FaRegCircleQuestion } from "react-icons/fa6";
import CallToAction from "@/components/common/call-to-action";

function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function PublicReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string | null>(null);
  const pageSize = 12;

  const {
    data: reports,
    isLoading,
    error,
  } = trpc.getPublicReports.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
    search: searchTerm || undefined,
  });

  // Fetch organization details when a slug is selected
  const { data: selectedOrganization, isLoading: isOrgLoading } =
    trpc.getOrganizationBySlug.useQuery(
      { slug: selectedOrgSlug! },
      { enabled: !!selectedOrgSlug },
    );

  const handleDownload = (fileKey: string, title: string) => {
    downloadReport(fileKey, title);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page when searching
  };

  return (
    <>
      {/* Filters Section */}
      <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white">
        <Container size="xs" className="">
          <TextComponent className="text-sm">
            Browse in-depth reports and verified experiences shared by our
            partner organizations to inform decisions and strengthen
            communities.
          </TextComponent>
        </Container>
      </section>

      <section className="py-8">
        <Container className="" size="sm">
          <form
            onSubmit={handleSearch}
            className="flex gap-4 w-full mx-auto max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reports by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white placeholder:text-sm shadow-none rounded-full"
              />
            </div>
          </form>
        </Container>
      </section>

      {/* Reports Grid */}
      <section className="pb-12 bg-muted">
        <Container size="xs" className="">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card
                  key={i}
                  className="hover:shadow-xs shadow-none border-none relative p-2 md:p-6 py-10 animate-pulse"
                >
                  <CardContent>
                    {/* Title skeleton */}
                    <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>

                    <hr className="my-4 border-gray-200" />

                    {/* Organization skeleton */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    </div>

                    <hr className="my-4 border-gray-200" />

                    {/* Author skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-40"></div>

                    <hr className="my-4 border-gray-200" />

                    {/* Date skeleton */}
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>

                    <hr className="my-4 border-gray-200" />

                    {/* Download button skeleton */}
                    <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">
                Failed to load reports. Please try again later.
              </p>
            </div>
          )}
          {/* Reports Grid */}
          {reports && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 mb-8">
                {(reports.data ?? []).map((report) => (
                  <Card
                    key={report.id}
                    className="hover:shadow-xs shadow-none border-none relative px-2 md:px-6 py-10"
                  >
                    <CardContent className="flex flex-col justify-between h-full">
                      <div>
                        <CardTitle className="text-lg mb-2 line-clamp-2">
                          <H4 className="line-clamp-2 text-lg">
                            {report.title}
                          </H4>
                        </CardTitle>
                      </div>

                      <div>
                        <hr className="my-4 border-gray-200" />

                        {report.organizationName && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4 shrink-0" />
                              <span>{report.organizationName}</span>
                            </div>
                            {report.organizationSlug && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    onClick={() =>
                                      setSelectedOrgSlug(
                                        report.organizationSlug || null,
                                      )
                                    }
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <FaRegCircleQuestion className="h-4 w-4" />
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      About {report.organizationName}
                                    </DialogTitle>
                                  </DialogHeader>

                                  {isOrgLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader className="h-6 w-6" />
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        Loading organization details...
                                      </span>
                                    </div>
                                  ) : selectedOrganization ? (
                                    <div className="space-y-4">
                                      <div>
                                        {selectedOrganization.description && (
                                          <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedOrganization.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className="space-y-2">
                                        {selectedOrganization.location && (
                                          <div className="flex items-center text-sm">
                                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                                            <span>
                                              {selectedOrganization.location}
                                            </span>
                                          </div>
                                        )}

                                        {selectedOrganization.website && (
                                          <div className="flex items-center text-sm">
                                            <Globe className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                                            <a
                                              href={`https://${selectedOrganization.website.replace(
                                                /^https?:\/\//,
                                                "",
                                              )}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {selectedOrganization.website.replace(
                                                /^https?:\/\//,
                                                "",
                                              )}
                                            </a>
                                          </div>
                                        )}

                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                                          <span>
                                            Member since{" "}
                                            {new Date(
                                              selectedOrganization.createdAt,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      Organization information not available.
                                    </p>
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        )}

                        <hr className="my-4 border-gray-200" />

                        {report.authorName && (
                          <>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Author:</span> By{" "}
                              {report.authorName}
                            </div>
                            <hr className="my-4 border-gray-200" />
                          </>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Published</span>
                          </div>
                          <span>{formatRelativeTime(report.createdAt)}</span>
                        </div>

                        <hr className="my-4 border-gray-200" />

                        <Button
                          onClick={() =>
                            handleDownload(report.fileKey, report.title)
                          }
                          className="w-full border-muted-foreground/10 shadow-none hover:bg-muted-foreground/12 transition-all ease-in-out duration-300 mt-6"
                          variant={"outline"}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {(reports.data?.length ?? 0) > pageSize && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {currentPage + 1}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!reports || (reports.data?.length ?? 0) < pageSize}
                    className=""
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {reports && reports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "There are no published reports available at this time."}
              </p>
            </div>
          )}
        </Container>
      </section>
      <section className="pb-20">
        <Container size="xs">
          <CallToAction
            callToAction={{
              title: "Get involved",
              description:
                "Start reporting incidents to help strengthen community accountability, or explore how these incidents cluster geographically across regions.",
              variant: "secondary",
              button1: {
                title: "Explore maps",
                link: "/maps",
              },
              button2: {
                title: "Sign in",
                link: "/sign-in",
              },
            }}
            color="primary"
          />
        </Container>
      </section>
    </>
  );
}
