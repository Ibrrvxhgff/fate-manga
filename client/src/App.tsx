import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Competitions from "./pages/Competitions";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/matches" component={Matches} />
    <Route path="/match/:id" component={MatchDetails} />
    <Route path="/competitions" component={Competitions} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}
