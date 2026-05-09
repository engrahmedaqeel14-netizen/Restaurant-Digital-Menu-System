import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChefHat, Lock } from "lucide-react";
import { useAdminLogin, useGetAdminProfile, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { data: profile } = useGetAdminProfile({
    query: {
      queryKey: getGetAdminProfileQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (profile) {
      setLocation("/");
    }
  }, [profile, setLocation]);

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: () => {
        setLocation("/");
      },
      onError: (err: any) => {
        setError(err?.error || "Invalid credentials");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-md p-4">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-sidebar-primary rounded-2xl flex items-center justify-center shadow-xl">
            <ChefHat className="w-8 h-8 text-sidebar-primary-foreground" />
          </div>
        </div>
        
        <Card className="border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Menucast Control</CardTitle>
            <CardDescription className="text-sidebar-foreground/60">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sidebar-foreground/80">Username</Label>
                <Input 
                  id="username" 
                  autoFocus
                  placeholder="admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground focus-visible:ring-sidebar-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sidebar-foreground/80">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground focus-visible:ring-sidebar-ring"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center">
                  <Lock className="w-4 h-4 mr-2 shrink-0" />
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground h-11 text-base font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}