"use client";

import DashboardLayout from "@/components/layouts/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth/authContext";
import { useEffect, useState } from "react";
import { getRecentUploads } from "@/lib/firebase/service/uploadFile/service";

import {
  Loader2,
  Grid,
  List,
  ChevronDown,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Page = () => {
  const { user } = useAuth();

  const [files, setFiles] = useState<any[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch
  useEffect(() => {
    const fetchRecent = async () => {
      if (!user?.uid) return;

      try {
        const docs = await getRecentUploads(user.uid, 50);
        setFiles(docs);
        setFilteredFiles(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [user]);

  // Filtering + sorting
  useEffect(() => {
    let updated = [...files];

    if (typeFilter !== "all") {
      updated = updated.filter(
        (file) =>
          file.category?.toLowerCase() === typeFilter ||
          file.categoryLabel?.toLowerCase() === typeFilter
      );
    }

    if (sortBy === "recent") {
      updated.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    }

    if (sortBy === "oldest") {
      updated.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateA - dateB;
      });
    }

    if (sortBy === "name") {
      updated.sort((a, b) =>
        (a.documentName || "").localeCompare(b.documentName || "")
      );
    }

    setFilteredFiles(updated);
  }, [files, typeFilter, sortBy]);

  const typeLabel =
    typeFilter === "all" ? "Type" : typeFilter.toUpperCase();

  const sortLabel =
    sortBy === "recent"
      ? "Modified"
      : sortBy === "oldest"
      ? "Oldest"
      : "Name";

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Recent</h1>
          <p className="text-muted-foreground">
            Files you recently uploaded or accessed
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">

          {/* Left Filters */}
          <div className="flex items-center gap-3">

            {/* Type Dropdown */}
            <DropdownMenu>
<div className="flex items-center border rounded-md overflow-hidden">

  <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm">
    {typeLabel}
    <ChevronDown className="h-4 w-4" />
  </DropdownMenuTrigger>

  {typeFilter !== "all" && (
    <button
      onClick={() => setTypeFilter("all")}
      className="px-2 py-2 border-l cursor-pointer"
    >
      <X className="h-3 w-3" />
    </button>
  )}

</div>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("xray")}>
                  X-Ray
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("mri")}>
                  MRI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("ct")}>
                  CT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("ultrasound")}>
                  Ultrasound
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
<div className="flex items-center border rounded-md overflow-hidden">

  <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm">
    {sortLabel}
    <ChevronDown className="h-4 w-4" />
  </DropdownMenuTrigger>

  {sortBy !== "recent" && (
    <button
      onClick={() => setSortBy("recent")}
      className="px-2 py-2 border-l cursor-pointer "
    >
      <X className="h-3 w-3" />
    </button>
  )}

</div>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  Recently added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          {/* View Toggle */}
          <TooltipProvider>
            <div className="flex items-center gap-2">

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 border rounded-md ${
                      viewMode === "grid" ? "bg-accent" : ""
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid layout</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 border rounded-md ${
                      viewMode === "list" ? "bg-accent" : ""
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List layout</TooltipContent>
              </Tooltip>

            </div>
          </TooltipProvider>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-200">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group overflow-hidden rounded-xl border hover:shadow-sm transition"
              >
                <div className="aspect-square">
                  <img
                    src={file.cloudinary?.thumbnailUrl || file.cloudinary?.url}
                    alt={file.documentName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3">
                  <p className="text-sm font-medium truncate">
                    {file.documentName || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {file.categoryLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && (
          <div className="border rounded-xl divide-y transition-all duration-200">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 text-sm hover:bg-muted/40 transition"
              >
                <div className="h-10 w-10 rounded overflow-hidden">
                  <img
                    src={file.cloudinary?.thumbnailUrl || file.cloudinary?.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <p className="font-medium">{file.documentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.categoryLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Page;