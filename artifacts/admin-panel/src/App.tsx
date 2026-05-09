import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Restaurants from "@/pages/restaurants";
import RestaurantNew from "@/pages/restaurant-new";
import RestaurantDetail from "@/pages/restaurant-detail";
import Menus from "@/pages/menus";
import Display from "@/pages/display";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/display/:customerId" component={Display} />
      <Route path="/login" component={Login} />
      <Route path="*">
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/restaurants" component={Restaurants} />
            <Route path="/restaurants/new" component={RestaurantNew} />
            <Route path="/restaurants/:id" component={RestaurantDetail} />
            <Route path="/menus" component={Menus} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;