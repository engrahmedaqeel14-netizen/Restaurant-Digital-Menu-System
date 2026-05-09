import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Store, 
  Images, 
  LogOut, 
  ChefHat 
} from "lucide-react";
import { useGetAdminProfile, useAdminLogout, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin, isLoading, isError } = useGetAdminProfile({
    query: {
      queryKey: getGetAdminProfileQueryKey(),
      retry: false,
    }
  });
  
  const logout = useAdminLogout({
    mutation: {
      onSuccess: () => {
        setLocation("/login");
      }
    }
  });

  useEffect(() => {
    if (!isLoading && (isError || !admin)) {
      if (location !== "/login") {
        setLocation("/login");
      }
    }
  }, [isError, isLoading, admin, location, setLocation]);

  const handleLogout = () => {
    logout.mutate();
  };

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Restaurants", href: "/restaurants", icon: Store },
    { label: "Menu Library", href: "/menus", icon: Images },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><ChefHat className="w-8 h-8 animate-pulse text-primary" /></div>;
  }

  if (isError || !admin) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <ChefHat className="w-6 h-6 text-sidebar-primary mr-3" />
          <span className="font-bold text-sidebar-foreground tracking-tight">Menucast Control</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">
            Platform
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-sm font-medium text-sidebar-foreground truncate pr-2">
              {admin.username}
            </span>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-sidebar-foreground bg-sidebar border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-background overflow-y-auto">
        <div className="p-8 pb-20 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
