"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard/dashboard-layout";
import { useAuth } from "@/context/auth/authContext";
import { getStarredDocuments } from "@/lib/firebase/service/uploadFile/service";

import {
  Loader2,
  FolderOpen,
  Grid,
  List,
  Search,
  ImageIcon,
  Star,
  MoreVertical,
  Eye,
  Download,
  Share2
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

import Image from "next/image";

export default function Page() {
const { user, loading: authLoading } = useAuth();

const [files, setFiles] = useState<any[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [pageLoading, setPageLoading] = useState(true);

const filteredFiles = files;

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchStarred = async () => {
      try {
        const data = await getStarredDocuments(user.uid);
        setFiles(data);
      } catch (err) {
        console.error("Error fetching starred:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchStarred();
  }, [user, authLoading]);

  const loading = authLoading || pageLoading;

    function handleViewFile(id: any): void {
        throw new Error("Function not implemented.");
    }

    function handleDownload(url: any, documentName: any): void {
        throw new Error("Function not implemented.");
    }

    function handleShare(id: any): void {
        throw new Error("Function not implemented.");
    }

    function handleStarToggle(id: any, isStarred: any): void {
        throw new Error("Function not implemented.");
    }

return (
  <DashboardLayout>
    <div className="flex-1 space-y-6 ">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Starred</h1>
          <p className="text-muted-foreground">
            Reports you marked important
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search starred files..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <Grid className="h-4 w-4" />
          </Button>

          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group overflow-hidden hover:shadow-lg transition-all py-0">
              
              {/* Thumbnail */}
              <div className="aspect-square relative">
                {file.cloudinary?.thumbnailUrl || file.cloudinary?.url ? (
                  <div className="relative w-full h-full">
                    <Image 
                      fill
                      src={file.cloudinary.thumbnailUrl || file.cloudinary.url}
                      alt={file.documentName}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                    {file.categoryLabel || file.category}
                  </span>
                </div>

                {/* Star */}
                <div className="absolute top-2 right-2 z-10">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>

              {/* Info */}
              <CardContent className="pb-4 px-5">
                <h3 className="font-medium text-sm truncate">
                  {file.documentName || 'Untitled'}
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <Card>
          <div className="divide-y">
            {filteredFiles.map((file) => (
              <div key={file.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-accent/50 transition-colors group">
                
                <div className="col-span-5 flex items-center gap-3">
  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
    {file.cloudinary?.thumbnailUrl ? (
      <div className="relative w-full h-full">
        <Image
          fill
          src={file.cloudinary.thumbnailUrl}
          alt={file.documentName}
          className="object-cover"
          sizes="32px"
        />
      </div>
    ) : (
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
    )}
  </div>

  <div className="flex-1 min-w-0">
    <p className="font-medium truncate">
      {file.documentName || "Untitled"}
    </p>
  </div>
</div>

                <div className="col-span-3">
                  {file.categoryLabel || file.category}
                </div>

                <div className="col-span-2 text-muted-foreground">
                  Starred
                </div>

              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  </DashboardLayout>
);
};