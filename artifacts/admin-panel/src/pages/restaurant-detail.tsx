import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { 
  useGetRestaurant, 
  useUpdateSubscriptionStatus,
  useListMenus,
  useDeleteMenu,
  getGetRestaurantQueryKey,
  getListMenusQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  MonitorPlay, 
  UploadCloud, 
  Image as ImageIcon,
  Clock,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function RestaurantDetail() {
  const [, params] = useRoute("/restaurants/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: restaurant, isLoading } = useGetRestaurant(id, {
    query: {
      queryKey: getGetRestaurantQueryKey(id),
      enabled: !!id,
    }
  });

  const { data: menus, isLoading: menusLoading } = useListMenus(
    { restaurantId: id },
    {
      query: {
        queryKey: getListMenusQueryKey({ restaurantId: id }),
        enabled: !!id,
      }
    }
  );

  const updateStatusMutation = useUpdateSubscriptionStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(id) });
        toast({ title: "Subscription updated" });
      }
    }
  });

  const deleteMenuMutation = useDeleteMenu({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMenusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(id) });
        toast({ title: "Menu deleted" });
      }
    }
  });

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("restaurantId", id.toString());
      if (uploadNotes) {
        formData.append("notes", uploadNotes);
      }

      const res = await fetch(`/api/menus/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      toast({ title: "Menu uploaded successfully" });
      setUploadNotes("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: getListMenusQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRestaurantQueryKey(id) });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was a problem uploading the menu image.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center flex items-center justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading restaurant details...</div>;
  }

  if (!restaurant) {
    return <div className="p-12 text-center text-muted-foreground">Restaurant not found.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/restaurants">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{restaurant.name}</h1>
              {restaurant.subscriptionStatus === 'active' && <Badge className="bg-emerald-500">Active</Badge>}
              {restaurant.subscriptionStatus === 'inactive' && <Badge variant="secondary">Inactive</Badge>}
              {restaurant.subscriptionStatus === 'suspended' && <Badge variant="destructive">Suspended</Badge>}
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm">ID: {restaurant.customerId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a href={`/display/${restaurant.customerId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="shadow-sm">
              <MonitorPlay className="w-4 h-4 mr-2" />
              View Live Display
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Upload */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="hover-elevate shadow-sm">
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Email</span>
                <span className="font-medium text-foreground">{restaurant.contactEmail || "Not provided"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Phone</span>
                <span className="font-medium text-foreground">{restaurant.contactPhone || "Not provided"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Address</span>
                <span className="font-medium text-foreground">{restaurant.address || "Not provided"}</span>
              </div>
              <Separator className="my-4" />
              <div>
                <span className="text-muted-foreground block mb-3">Subscription Controls</span>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant={restaurant.subscriptionStatus === 'active' ? "default" : "outline"}
                    className={restaurant.subscriptionStatus === 'active' ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => updateStatusMutation.mutate({ id, data: { status: 'active' } })}
                    disabled={updateStatusMutation.isPending || restaurant.subscriptionStatus === 'active'}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Activate
                  </Button>
                  <Button 
                    size="sm" 
                    variant={restaurant.subscriptionStatus === 'suspended' ? "destructive" : "outline"}
                    onClick={() => updateStatusMutation.mutate({ id, data: { status: 'suspended' } })}
                    disabled={updateStatusMutation.isPending || restaurant.subscriptionStatus === 'suspended'}
                  >
                    <ShieldAlert className="w-4 h-4 mr-1.5" /> Suspend
                  </Button>
                  <Button 
                    size="sm" 
                    variant={restaurant.subscriptionStatus === 'inactive' ? "secondary" : "outline"}
                    onClick={() => updateStatusMutation.mutate({ id, data: { status: 'inactive' } })}
                    disabled={updateStatusMutation.isPending || restaurant.subscriptionStatus === 'inactive'}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" /> Deactivate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <UploadCloud className="w-5 h-5" /> Push New Menu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea 
                placeholder="Optional notes for this version..." 
                className="resize-none h-20 text-sm"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
              />
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium">Uploading & Processing...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Drag and drop image here</p>
                    <p className="text-xs text-muted-foreground mb-4">JPG, PNG up to 10MB</p>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Uploading immediately pushes this menu to the live display.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Menu & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover-elevate shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-card">
              <div>
                <CardTitle>Live Display Preview</CardTitle>
                <CardDescription>Currently showing on the restaurant screen</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                LIVE
              </Badge>
            </CardHeader>
            <div className="bg-black/90 aspect-video relative flex items-center justify-center">
              {restaurant.activeMenuUrl ? (
                <img src={restaurant.activeMenuUrl} alt="Active Menu" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-white/50">
                  <MonitorPlay className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active menu. Upload one to display.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="hover-elevate shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Version History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {menusLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading history...</div>
              ) : menus && menus.length > 0 ? (
                <div className="divide-y border-border border-t">
                  {menus.map((menu) => (
                    <div key={menu.id} className={`p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${menu.isActive ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                      <div className="h-16 w-24 bg-black rounded shrink-0 overflow-hidden shadow-sm">
                        <img src={menu.imageUrl} alt="Menu" className="w-full h-full object-contain" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {format(new Date(menu.uploadedAt), "MMM d, yyyy h:mm a")}
                          </span>
                          {menu.isActive && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-5">Active</Badge>
                          )}
                        </div>
                        {menu.notes && <p className="text-sm text-muted-foreground truncate">{menu.notes}</p>}
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={menu.imageUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                        {!menu.isActive && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => deleteMenuMutation.mutate({ id: menu.id })}
                            disabled={deleteMenuMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm border-t border-border">
                  No menus have been uploaded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}