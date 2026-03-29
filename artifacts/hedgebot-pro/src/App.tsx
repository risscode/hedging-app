import { useState, useEffect } from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAuthenticated } from './lib/auth';
import { applyTheme, getTheme } from './lib/theme';
import { LoginPage } from './pages/LoginPage';
import { HedgebotPage } from './pages/HedgebotPage';
import { GoldPage } from './pages/GoldPage';
import { Navbar } from './components/Navbar';
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [pageKey, setPageKey] = useState(0); // for animation re-trigger on page change

  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLogout={() => setLoggedIn(false)} />
      <div key={pageKey} className="page-enter">
        <Switch>
          <Route path="/" component={HedgebotPage} />
          <Route path="/hedgebot" component={HedgebotPage} />
          <Route path="/gold" component={GoldPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
