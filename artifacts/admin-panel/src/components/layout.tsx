import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Store,
  Images,
  LogOut,
  ChefHat,
  Menu,
  X,
} from "lucide-react";
import { useGetAdminProfile, useAdminLogout, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Restaurants", href: "/restaurants", icon: Store },
  { label: "Menu Library", href: "/menus", icon: Images },
];

function NavLinks({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className="block" onClick={onNavigate}>
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
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: admin, isLoading, isError } = useGetAdminProfile({
    query: {
      queryKey: getGetAdminProfileQueryKey(),
      retry: false,
    },
  });

  const logout = useAdminLogout({
    mutation: {
      onSuccess: () => {
        setLocation("/login");
      },
    },
  });

  useEffect(() => {
    if (!isLoading && (isError || !admin)) {
      if (location !== "/login") {
        setLocation("/login");
      }
    }
  }, [isError, isLoading, admin, location, setLocation]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ChefHat className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (isError || !admin) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-full shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <ChefHat className="w-6 h-6 text-sidebar-primary mr-3" />
          <span className="font-bold text-sidebar-foreground tracking-tight">Menucast Control</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">
            Platform
          </div>
          <NavLinks location={location} />
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

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center">
            <ChefHat className="w-6 h-6 text-sidebar-primary mr-3" />
            <span className="font-bold text-sidebar-foreground tracking-tight">Menucast Control</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/70">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">
            Platform
          </div>
          <NavLinks location={location} onNavigate={() => setMobileOpen(false)} />
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
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background shrink-0 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="text-foreground mr-3"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <ChefHat className="w-5 h-5 text-primary mr-2" />
          <span className="font-bold text-foreground tracking-tight text-sm">Menucast Control</span>
        </div>

        <div className="p-4 sm:p-6 md:p-8 pb-20 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
