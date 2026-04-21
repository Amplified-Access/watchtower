"use client";

import { useState } from "react";
import { trpc } from "@/_trpc/client";
import Container from "@/components/common/container";
import HeadingThree from "@/components/common/heading-three";
import TextComponent from "@/components/common/text-component";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, FileText, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { downloadFileFromR2 } from "@/utils/file-download";
import { toast } from "sonner";
import Loader from "@/components/common/loader";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import H4 from "@/components/common/heading-four";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FaRegCircleQuestion } from "react-icons/fa6";
import CallToAction from "@/components/common/call-to-action";

const DatasetsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Fetch datasets with filters
  const { data: datasetsData, isLoading } = trpc.getPublicDatasets.useQuery({
    search: searchTerm || undefined,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    format: selectedFormat === "all" ? undefined : selectedFormat,
    page: currentPage,
    limit: 12,
  });

  // Fetch categories for filter
  const { data: categories } = trpc.getDatasetCategories.useQuery();

  // Mutation for incrementing download count
  const incrementDownload = trpc.incrementDatasetDownload.useMutation();

  const handleDownload = async (dataset: any) => {
    setIsDownloading(dataset.id);
    try {
      // Increment download count
      await incrementDownload.mutateAsync({ id: dataset.id });

      // Download the file
      await downloadFileFromR2(dataset.fileKey, dataset.fileName);

      toast.success(`Downloaded ${dataset.fileName}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "csv":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "json":
        return <Database className="h-4 w-4 text-blue-600" />;
      case "excel":
      case "xlsx":
        return <FileText className="h-4 w-4 text-emerald-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <>
      {/* Filters Section */}
      <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white ">
        <Container size="xs" className="">
          <TextComponent className="text-sm ">
            Discover comprenensive datasets - freely available for research,
            analysis and community use.
          </TextComponent>
        </Container>
      </section>
      <section className="py-8">
        <Container className="" size="xs">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 " />
                <Input
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white placeholder:text-md shadow-none rounded-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-48 bg-white shadow-none text-muted-foreground">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(
                    (category: { category: string; count: number }) => (
                    <SelectItem
                      key={category.category}
                      value={category.category}
                    >
                      {category.category} ({category.count})
                    </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-full md:w-40 bg-white shadow-none text-muted-foreground">
                  <SelectValue placeholder="All Formats" className="" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(searchTerm ||
              selectedCategory !== "all" ||
              selectedFormat !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedFormat("all");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Container>
      </section>

      {/* Datasets Grid */}
      <section className="pb-12 bg-muted">
        <Container size="xs" className="">
          {isLoading ? (
            // Loading skeleton with pulsing animation
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 mb-8">
              {Array.from({ length: 6 }, (_, i) => (
                <Card
                  key={i}
                  className="hover:shadow-xs shadow-none border-none relative p-2 md:p-6 py-10 animate-pulse"
                >
                  <CardContent className="flex flex-col justify-between h-full">
                    {/* Title and Description skeleton */}
                    <div>
                      <div className="h-6 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded-md mb-2 w-full"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
                    </div>

                    <div>
                      <hr className="my-4 border-gray-200" />

                      {/* Format and category skeleton */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex justify-between w-full mb-2">
                          <div className="flex gap-2 items-center">
                            <div className="h-4 w-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        {/* Tags skeleton */}
                        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                      </div>

                      <hr className="my-4 border-gray-200" />

                      {/* Size and downloads skeleton */}
                      <div className="flex justify-between text-sm">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </div>

                      <hr className="my-4 border-gray-200" />

                      {/* Source skeleton (optional) */}
                      <div className="h-4 bg-gray-200 rounded w-40"></div>

                      <hr className="my-4 border-gray-200" />

                      {/* Version and date skeleton */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>

                      <hr className="my-4 border-gray-200" />

                      {/* Download button skeleton */}
                      <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : datasetsData?.data.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <HeadingThree className="text-gray-600 mb-2">
                No datasets found
              </HeadingThree>
              <TextComponent className="text-gray-500">
                Try adjusting your search terms or filters.
              </TextComponent>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-12 mb-8">
                {datasetsData?.data.map((dataset: any) => (
                  <Card
                    key={dataset.id}
                    className="hover:shadow-xs shadow-none border-none relative p-2 md:p-6 py-10"
                  >
                    <CardContent className="flex flex-col justify-between h-full">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 line-clamp-2 flex">
                            <H4 className="line-clamp-2 text-lg">
                              {dataset.title}
                            </H4>
                          </CardTitle>
                          <TextComponent className="">
                            {dataset.description}
                          </TextComponent>
                        </div>
                      </div>
                      <div>
                        <hr className="my-4 border-gray-200" />

                        <div className="flex flex-wrap gap-2">
                          <div className="flex justify-between w-full">
                            <div className="flex gap-1 items-center">
                              <div className="shrink-0">
                                {getFormatIcon(dataset.format)}
                              </div>
                              {dataset.format}
                            </div>
                            <Badge variant="secondary">
                              {dataset.category}
                            </Badge>
                          </div>
                          {dataset.tags?.slice(0, 2).map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <hr className="my-4 border-gray-200" />

                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Size: {formatFileSize(dataset.fileSize)}</span>
                          <span>{dataset.downloadCount} downloads</span>
                        </div>

                        <hr className="my-4 border-gray-200" />

                        {dataset.source && (
                          <>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Source:</span>{" "}
                              {dataset.source}
                            </div>
                            <hr className="my-4 border-gray-200" />
                          </>
                        )}

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>v{dataset.version}</span>
                          <span>
                            {dataset.publishedAt &&
                              formatDistanceToNow(
                                new Date(dataset.publishedAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                          </span>
                        </div>

                        <hr className="my-4 border-gray-200" />

                        <Button
                          onClick={() => handleDownload(dataset)}
                          disabled={isDownloading === dataset.id}
                          className="w-full border-muted-foreground/10 shadow-none hover:bg-muted-foreground/12 transition-all ease-in-out duration-300 mt-6"
                          variant={"outline"}
                        >
                          {isDownloading === dataset.id ? (
                            <Loader className="mr-2" size="16" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isDownloading === dataset.id ? "" : "Download"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {datasetsData && datasetsData.pagination.totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1)
                              setCurrentPage(currentPage - 1);
                          }}
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: datasetsData.pagination.totalPages },
                        (_, i) => i + 1,
                      )
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === datasetsData.pagination.totalPages ||
                            Math.abs(page - currentPage) <= 2,
                        )
                        .map((page, index, array) => {
                          const showEllipsis =
                            index > 0 && page - array[index - 1] > 1;
                          return (
                            <div key={page}>
                              {showEllipsis && (
                                <span className="px-2">...</span>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(page);
                                  }}
                                  isActive={currentPage === page}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            </div>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (
                              currentPage < datasetsData.pagination.totalPages
                            ) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                          className={
                            currentPage >= datasetsData.pagination.totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Container>
      </section>
      <section className="pb-20">
        <Container size="xs" className="">
          <CallToAction
            callToAction={{
              title: "Keep exploring",
              description:
                "Dive deeper into incident patterns with our interactive maps or browse comprehensive reports across different regions and themes.",
              variant: "secondary",
              button1: {
                title: "Maps",
                link: "/maps",
              },
              button2: {
                title: "Reports",
                link: "/reports",
              },
            }}
            color="primary"
          />
        </Container>
      </section>

      {/* About Section */}
      {/* <section className="py-16 bg-white">
        <Container size="lg">
          <div className="max-w-3xl mx-auto text-center">
            <HeadingTwo className="mb-6">
              About Our Open Data Initiative
            </HeadingTwo>
            <TextComponent className="text-gray-600 mb-8">
              Our open data repository is part of our commitment to transparency
              and knowledge sharing. All datasets are published under open
              licenses, enabling researchers, journalists, and advocates to
              access and use this information to drive positive change.
            </TextComponent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">High Quality</h3>
                <p className="text-gray-600 text-sm">
                  All datasets undergo rigorous quality checks and validation
                  processes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Open License</h3>
                <p className="text-gray-600 text-sm">
                  Published under Creative Commons licenses for maximum
                  accessibility.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Regular Updates</h3>
                <p className="text-gray-600 text-sm">
                  Datasets are updated regularly with the latest information.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section> */}
    </>
  );
};

export default DatasetsPage;
