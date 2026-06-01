
  



import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { ClerkProvider } from "@clerk/clerk-react";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Placeholder imports for pages
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Goals from "@/pages/goals";
import Analytics from "@/pages/analytics";
import Insights from "@/pages/insights";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Redirect to="/dashboard" />;
  }
  return <Redirect to="/login" />;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={RootRoute} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />

        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/tasks" component={Tasks} />
        <ProtectedRoute path="/goals" component={Goals} />
        <ProtectedRoute path="/analytics" component={Analytics} />
        <ProtectedRoute path="/insights" component={Insights} />
        <ProtectedRoute path="/profile" component={Profile} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;