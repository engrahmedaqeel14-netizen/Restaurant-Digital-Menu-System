import { useState } from "react";
import { Link } from "wouter";
import { 
  useListRestaurants, 
  useDeleteRestaurant 
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Store, 
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  MonitorPlay
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { getListRestaurantsQueryKey } from "@workspace/api-client-react";

export default function Restaurants() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurantToDelete, setRestaurantToDelete] = useState<number | null>(null);

  const { data: restaurants, isLoading } = useListRestaurants();

  const deleteMutation = useDeleteRestaurant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRestaurantsQueryKey() });
        setRestaurantToDelete(null);
      }
    }
  });

  const filteredRestaurants = restaurants?.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "inactive":
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Restaurants</h1>
          <p className="text-muted-foreground mt-1">Manage client accounts and their digital displays</p>
        </div>
        <Link href="/restaurants/new">
          <Button className="shrink-0 active-elevate-2 shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Add Restaurant
          </Button>
        </Link>
      </div>

      <Card className="hover-elevate shadow-sm">
        <div className="p-4 border-b border-border flex items-center bg-card/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50 border-input"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading restaurants...</div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No restaurants found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchTerm ? "No results match your search." : "Get started by adding your first restaurant client."}
              </p>
              {!searchTerm && (
                <Link href="/restaurants/new">
                  <Button variant="outline" className="mt-4">
                    Add Restaurant
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y border-border">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-muted/30 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link href={`/restaurants/${restaurant.id}`} className="text-lg font-bold text-foreground hover:text-primary transition-colors truncate">
                        {restaurant.name}
                      </Link>
                      {getStatusBadge(restaurant.subscriptionStatus)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{restaurant.customerId}</span>
                      <span>Added {format(new Date(restaurant.createdAt), "MMM yyyy")}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="h-16 w-24 bg-muted rounded border border-border overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground text-xs shadow-sm">
                      {restaurant.activeMenuUrl ? (
                        <img src={restaurant.activeMenuUrl} alt="Active Menu" className="w-full h-full object-cover" />
                      ) : (
                        <span>No Menu</span>
                      )}
                    </div>

                    <a
                      href={`${import.meta.env.BASE_URL}display/${restaurant.customerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open customer preview"
                    >
                      <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                        <MonitorPlay className="w-4 h-4" />
                        Preview
                      </Button>
                    </a>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground group-hover:text-foreground">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <Link href={`/restaurants/${restaurant.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Manage Details
                          </DropdownMenuItem>
                        </Link>
                        <a href={`/display/${restaurant.customerId}`} target="_blank" rel="noopener noreferrer">
                          <DropdownMenuItem className="cursor-pointer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Live Display
                          </DropdownMenuItem>
                        </a>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                          onClick={() => setRestaurantToDelete(restaurant.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!restaurantToDelete} onOpenChange={(open) => !open && setRestaurantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this restaurant and all associated menus. 
              The live display screen will instantly stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => restaurantToDelete && deleteMutation.mutate({ id: restaurantToDelete })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Restaurant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}