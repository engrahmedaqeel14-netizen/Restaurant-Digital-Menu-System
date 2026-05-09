import { Link } from "wouter";
import { format } from "date-fns";
import { 
  useGetRestaurantStats, 
  useListMenus 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, CheckCircle, XCircle, AlertTriangle, Images } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetRestaurantStats();
  const { data: recentMenus, isLoading: menusLoading } = useListMenus({
    query: {
      queryKey: ["/api/menus", { limit: 5 }] as any,
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and recent activity</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Restaurants</CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {statsLoading ? "-" : stats?.total || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {statsLoading ? "-" : stats?.active || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {statsLoading ? "-" : stats?.suspended || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Uploads</CardTitle>
            <Images className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {statsLoading ? "-" : stats?.recentUploads || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-3 hover-elevate">
        <CardHeader>
          <CardTitle>Recent Menu Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {menusLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading recent menus...</div>
          ) : recentMenus && recentMenus.length > 0 ? (
            <div className="space-y-4">
              {recentMenus.slice(0, 5).map((menu) => (
                <div key={menu.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/50">
                  <div className="h-16 w-24 rounded-md overflow-hidden bg-muted shrink-0">
                    <img src={menu.imageUrl} alt="Menu thumbnail" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/restaurants/${menu.restaurantId}`} className="text-base font-semibold text-foreground hover:underline truncate block">
                      {menu.restaurantName}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span>Uploaded {format(new Date(menu.uploadedAt), "MMM d, yyyy h:mm a")}</span>
                      {menu.isActive && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          Active Display
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Images className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No recent menus uploaded.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}