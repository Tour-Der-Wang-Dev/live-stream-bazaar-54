import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { supabase } from "./integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

// Pages
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Create a client
const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language_preference')
        .eq('id', userId)
        .single();
      
      setUserRole(profile?.language_preference || 'student');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('student');
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Router>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />} />
                <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />} />
                
                {/* Protected Routes */}
                <Route path="/student-dashboard" element={isAuthenticated && userRole === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />
                <Route path="/teacher-dashboard" element={isAuthenticated && userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </QueryClientProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;