import { useListMenus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Images, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Menus() {
  const { data: menus, isLoading } = useListMenus();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Library</h1>
        <p className="text-muted-foreground mt-1">All visual assets uploaded across the platform</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading menu library...</div>
      ) : menus && menus.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {menus.map((menu) => (
            <Card key={menu.id} className="overflow-hidden hover-elevate shadow-sm group">
              <div className="aspect-[4/3] bg-black relative border-b border-border overflow-hidden">
                <img 
                  src={menu.imageUrl} 
                  alt="Menu asset" 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                />
                {menu.isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500 shadow-md">Active Display</Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={menu.imageUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="shadow-lg">
                      <ExternalLink className="w-4 h-4 mr-2" /> View Full
                    </Button>
                  </a>
                </div>
              </div>
              <CardContent className="p-4">
                <Link href={`/restaurants/${menu.restaurantId}`} className="font-semibold text-foreground hover:text-primary hover:underline truncate block mb-1">
                  {menu.restaurantName || "Unknown Restaurant"}
                </Link>
                <div className="text-xs text-muted-foreground font-mono mb-3">
                  {menu.restaurantCustomerId}
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{format(new Date(menu.uploadedAt), "MMM d, yyyy")}</span>
                </div>
                {menu.notes && (
                  <p className="mt-3 text-sm text-foreground/80 bg-muted/50 p-2 rounded border border-border/50 line-clamp-2">
                    {menu.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center flex flex-col items-center justify-center bg-card/50">
          <Images className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Library Empty</h3>
          <p className="text-muted-foreground text-sm">No menus have been uploaded yet across any restaurant.</p>
        </Card>
      )}
    </div>
  );
}