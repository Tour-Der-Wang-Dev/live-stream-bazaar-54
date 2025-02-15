
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import CreateWebinar from "./pages/CreateWebinar";
import WebinarRoom from "./pages/WebinarRoom";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Index /> : <Navigate to="/auth" />} />
          <Route path="/create" element={isAuthenticated ? <CreateWebinar /> : <Navigate to="/auth" />} />
          <Route path="/webinar/:id" element={isAuthenticated ? <WebinarRoom /> : <Navigate to="/auth" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </Router>
  );
}

export default App;
