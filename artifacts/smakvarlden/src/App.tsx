import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/Dashboard";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import Ingredients from "@/pages/Ingredients";
import Calculator from "@/pages/Calculator";
import Community from "@/pages/Community";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import HelpCenter from "@/pages/HelpCenter";
import Svinn from "@/pages/Svinn";
import MarketInsights from "@/pages/MarketInsights";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function LoginPage() {
  const [, navigate] = useLocation();
  return <Login onSuccess={() => navigate("/")} />;
}

function Router() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/recipes">
              <Recipes />
            </Route>
            <Route path="/recipes/:id">
              {(params) => <RecipeDetail id={Number(params.id)} />}
            </Route>
            <Route path="/ingredients">
              <Ingredients />
            </Route>
            <Route path="/calculator">
              <Calculator />
            </Route>
            <Route path="/community">
              <Community />
            </Route>
            <Route path="/admin" component={Admin} />
            <Route path="/help" component={HelpCenter} />
            <Route path="/svinn" component={Svinn} />
            <Route path="/market" component={MarketInsights} />
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
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
