import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth, AppErrorBoundary } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import { useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const RecipeDetail = lazy(() => import("@/pages/RecipeDetail"));
const Ingredients = lazy(() => import("@/pages/Ingredients"));
const Calculator = lazy(() => import("@/pages/Calculator"));
const Community = lazy(() => import("@/pages/Community"));
const CommunityPost = lazy(() => import("@/pages/CommunityPost"));
const Login = lazy(() => import("@/pages/Login"));
const Admin = lazy(() => import("@/pages/Admin"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const Svinn = lazy(() => import("@/pages/Svinn"));
const MarketInsights = lazy(() => import("@/pages/MarketInsights"));
const Upgrade = lazy(() => import("@/pages/Upgrade"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 1, refetchOnMount: false, refetchOnWindowFocus: false } },
});

function LoginPage() {
  const [, navigate] = useLocation();
  return <Login onSuccess={() => navigate("/")} />;
}

function PaymentSuccessBanner() {
  const { toast } = useToast();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast({ title: "Betalning lyckades!", description: "Välkommen till Pro Chef. Alla funktioner är nu upplåsta." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);
  return null;
}

function RouteLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex min-h-[40vh] items-center justify-center" : "min-h-screen flex items-center justify-center bg-background"}>
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
    <AppErrorBoundary>
      <Suspense fallback={<RouteLoader />}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route>
            <Layout>
              <PaymentSuccessBanner />
              <AppErrorBoundary>
                <Suspense fallback={<RouteLoader compact />}>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/recipes"><Recipes /></Route>
                    <Route path="/recipes/:id">{(params) => <RecipeDetail id={Number(params.id)} />}</Route>
                    <Route path="/ingredients"><Ingredients /></Route>
                    <Route path="/calculator"><Calculator /></Route>
                    <Route path="/community"><Community /></Route>
                    <Route path="/community/:id">{(params) => <CommunityPost id={Number(params.id)} />}</Route>
                    <Route path="/admin" component={Admin} />
                    <Route path="/help" component={HelpCenter} />
                    <Route path="/svinn" component={Svinn} />
                    <Route path="/market" component={MarketInsights} />
                    <Route path="/upgrade" component={Upgrade} />
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
              </AppErrorBoundary>
            </Layout>
          </Route>
        </Switch>
      </Suspense>
    </AppErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
