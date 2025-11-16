import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  useLocation,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext
} from "react-router-dom";
import { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import AuthScreen from "./components/AuthScreen";
import Index from "./pages/Index";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import MapPage from "./pages/MapPage";
import DonationPage from "./pages/DonationPage";
import CollabPage from "./pages/CollabPage";
import ExplorePage from "./pages/ExplorePage";
import SettingsPage from "./pages/SettingsPage";
import BookOfExtinctionPage from "./pages/BookOfExtinctionPage";
import AdminPage from "./pages/AdminPage";
import UsernameSetup from './components/profile/UsernameSetup';
import ProfileSettings from './components/profile/ProfileSettings';
import PublicProfile from './components/profile/PublicProfile';
import PublicProfileWrapper from './components/profile/PublicProfileWrapper';
import { getCurrentUser } from './services/firebaseService';
import MessagesPage from './pages/MessagesPage';
// Import i18n configuration
import './i18n';

// Set React Router future flags
// @ts-ignore - These are future flags and might not be typed yet
window.REACT_ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

const queryClient = new QueryClient();

// Main app content with authentication handling
const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsernameSetup, setNeedsUsernameSetup] = useState(false);
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    checkAuthState();
  }, []);
  
  // Effect to redirect after authentication
  useEffect(() => {
    if (justAuthenticated) {
      console.log("Just authenticated, navigating to home page");
      navigate('/', { replace: true });
      setJustAuthenticated(false);
    }
  }, [justAuthenticated, navigate]);
  
  const checkAuthState = async () => {
    try {
      console.log("Checking auth state...");
      const currentUser = await getCurrentUser();
      console.log("Current user:", currentUser ? "Logged in" : "Not logged in");
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      
      // Check if username setup is needed
      if (currentUser && !currentUser.displayName) {
        console.log("User needs username setup");
        setNeedsUsernameSetup(true);
      }
      setAuthError(null);
    } catch (error: any) {
      console.error('Auth state check error:', error);
      setAuthError(error.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAuthComplete = (usernameSetupNeeded: boolean) => {
    console.log("Auth complete, username setup needed:", usernameSetupNeeded);
    checkAuthState();
    if (usernameSetupNeeded) {
      setNeedsUsernameSetup(true);
    } else {
      console.log("Setting justAuthenticated to true");
      setJustAuthenticated(true);
    }
  };
  
  const handleUsernameSetupComplete = () => {
    console.log("Username setup complete");
    setNeedsUsernameSetup(false);
    setJustAuthenticated(true);
    checkAuthState();
  };
  
  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };
  
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <>
        <div className="loading-spinner">Loading...</div>
      </>
    );
  }

  // Show username setup if needed
  if (user && needsUsernameSetup) {
    return (
      <>
        <UsernameSetup onComplete={handleUsernameSetupComplete} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthComplete={handleAuthComplete} />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/collab" element={<CollabPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/settings" element={<ProfileSettings onLogout={handleLogout} />} />
        <Route path="/extinction-book" element={<BookOfExtinctionPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/profile/:userId" element={<PublicProfileWrapper />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
