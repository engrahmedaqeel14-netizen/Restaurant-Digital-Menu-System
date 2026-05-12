import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import {
  useGetRestaurantStats,
  useListMenus,
  useListRestaurants,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Store,
  CheckCircle,
  AlertTriangle,
  Images,
  Plus,
  ArrowRight,
  MonitorPlay,
  XCircle,
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetRestaurantStats();
  const { data: recentMenus, isLoading: menusLoading } = useListMenus();
  const { data: restaurants, isLoading: restaurantsLoading } = useListRestaurants();

  const statCards = [
    {
      label: "Total Restaurants",
      value: stats?.total ?? 0,
      icon: Store,
      iconColor: "text-primary",
      href: "/restaurants",
      description: "View all clients",
      loading: statsLoading,
    },
    {
      label: "Active Subscriptions",
      value: stats?.active ?? 0,
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      href: "/restaurants",
      description: "Currently live",
      loading: statsLoading,
    },
    {
      label: "Suspended",
      value: stats?.suspended ?? 0,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      href: "/restaurants",
      description: "Needs attention",
      loading: statsLoading,
    },
    {
      label: "Recent Uploads",
      value: stats?.recentUploads ?? 0,
      icon: Images,
      iconColor: "text-primary",
      href: "/menus",
      description: "Last 7 days",
      loading: statsLoading,
    },
  ];

  const activeRestaurants = restaurants?.filter(r => r.subscriptionStatus === "active") ?? [];
  const suspendedRestaurants = restaurants?.filter(r => r.subscriptionStatus === "suspended") ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and recent activity</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/restaurants/new">
            <Button className="shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Restaurant
            </Button>
          </Link>
          <Link href="/menus">
            <Button variant="outline" className="gap-2">
              <Images className="w-4 h-4" />
              Menu Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="hover-elevate cursor-pointer group transition-all border-border hover:border-primary/30"
            onClick={() => setLocation(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stat.loading ? (
                  <span className="inline-block w-8 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                {stat.description}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Menu Uploads */}
        <Card className="lg:col-span-2 hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="text-base font-semibold">Recent Menu Uploads</CardTitle>
            <Link href="/menus">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {menusLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border animate-pulse">
                    <div className="h-16 w-24 rounded-md bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMenus && recentMenus.length > 0 ? (
              <div className="space-y-3">
                {recentMenus.slice(0, 5).map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setLocation(`/restaurants/${menu.restaurantId}`)}
                  >
                    <div className="h-16 w-24 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                      <img
                        src={menu.imageUrl}
                        alt="Menu thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {menu.restaurantName}
                      </p>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        <span>{format(new Date(menu.uploadedAt), "MMM d, yyyy h:mm a")}</span>
                        {menu.isActive && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                          >
                            Active Display
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Images className="h-7 w-7 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No menus uploaded yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a menu image to a restaurant to get started.
                </p>
                <Link href="/restaurants">
                  <Button variant="outline" size="sm">Go to Restaurants</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Quick Actions */}
          <Card className="hover-elevate">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Link href="/restaurants/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  Add New Restaurant
                </Button>
              </Link>
              <Link href="/restaurants" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-blue-500" />
                  </div>
                  Manage Restaurants
                </Button>
              </Link>
              <Link href="/menus" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-7 h-7 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Images className="w-4 h-4 text-violet-500" />
                  </div>
                  Browse Menu Library
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Active Restaurants */}
          <Card className="hover-elevate flex-1">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-base font-semibold">Live Displays</CardTitle>
              <Link href="/restaurants">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground h-7 px-2">
                  All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {restaurantsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : activeRestaurants.length > 0 ? (
                <div className="space-y-2">
                  {activeRestaurants.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                      onClick={() => setLocation(`/restaurants/${r.id}`)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        <span className="text-sm font-medium text-foreground truncate">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">{r.customerId}</span>
                        <a
                          href={`/display/${r.customerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MonitorPlay className="w-3.5 h-3.5 text-primary" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {suspendedRestaurants.length > 0 && (
                    <div className="pt-2 border-t border-border mt-2">
                      {suspendedRestaurants.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/restaurants/${r.id}`)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-sm font-medium text-muted-foreground truncate">{r.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-500">Suspended</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <XCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No active restaurants</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
