import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { restoreSession, setUser } from './store/slices/authSlice';
import { authService } from './services/authService';
import AppLayout from './components/layout/AppLayout/AppLayout';
import ManagerLayout from './components/layout/ManagerLayout/ManagerLayout';
import EmployeeLayout from './components/layout/EmployeeLayout/EmployeeLayout';
import AIChatbot from './components/common/AIChatbot/AIChatbot';
import AdminRoute from './components/guards/AdminRoute';
import ManagerRoute from './components/guards/ManagerRoute';
import EmployeeRoute from './components/guards/EmployeeRoute';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import Board from './pages/Board/Board';
import HR from './pages/HR/HR';
import Finance from './pages/Finance/Finance';
import ModuleHub from './pages/ModuleHub/ModuleHub';
import Onboarding from './pages/Onboarding/Onboarding';
import Landing from './pages/Landing/Landing';
import ProjectManagement from './pages/ProjectManagement/ProjectManagement';
import Leads from './pages/Leads/Leads';
import Clients from './pages/Clients/Clients';
import Docs from './pages/Docs/Docs';
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard/EmployeeDashboard';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound/NotFound';
import { Loader2 } from 'lucide-react';

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  // Apply theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Restore session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    let lastToken = null; // Used to deduplicate events

    // 1. Explicitly restore session to guarantee we don't get stuck loading
    dispatch(restoreSession());

    // 2. Synchronously attach listener for future events (avoids memory leaks)
    const { data } = authService.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change event:', event);
      if (!isMounted) return;
      if (event === 'INITIAL_SESSION') return; // Handled by restoreSession

      // Deduplicate continuous SIGNED_IN events to prevent infinite network requests
      const currentToken = session?.access_token;
      if (event === 'SIGNED_IN') {
        if (currentToken === lastToken) {
          console.log('[Auth] Ignored duplicate SIGNED_IN event');
          return;
        }
        lastToken = currentToken;
      }

      if (session) {
        try {
          const profile = await authService.getProfile(session.user.id);
          if (isMounted) {
            dispatch(setUser({
              id: profile.id,
              _id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              assignedModule: profile.assigned_module,
              department: profile.department,
              avatar: profile.avatar_url,
              phone: profile.phone,
              location: profile.location,
              jobTitle: profile.job_title || localStorage.getItem(`dw-profile-job-title-${profile.id}`) || 'Product Lead',
              bio: profile.bio || localStorage.getItem(`dw-profile-bio-${profile.id}`) || 'Building the future of work management.',
            }));
          }
        } catch (err) {
          console.error('[Auth] Failed to load profile for session user:', err);
          if (isMounted) {
            dispatch(setUser({
              id: session.user.id,
              _id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              role: 'employee',
            }));
          }
        }
      } else {
        if (isMounted) {
          dispatch(setUser(null));
        }
      }
    });

    return () => {
      isMounted = false;
      if (data && data.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, [dispatch]);

  // Smart redirect for root path based on role
  const getRootRedirect = () => {
    if (!isAuthenticated || !user) return '/landing';
    if (user.role === 'manager' && user.assignedModule) {
      return `/manager/${user.assignedModule}`;
    }
    if (user.role === 'employee') {
      return '/employee/dashboard';
    }
    return '/modules';
  };

    // Removed the 3-second aggressive timeout. If Supabase is cold-starting, 
    // it can take up to 5-10 seconds to restore the session or login.

  // Show a loading spinner while restoring session
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a14',
        color: '#e0e0e0',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', opacity: 0.6 }}>Loading DevelopWork...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isAuthenticated && user && <AIChatbot />}
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Admin / Full App Routes (with Layout) */}
        <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
          <Route path="/modules" element={<ModuleHub />} />
          <Route path="/board/:boardId" element={<Board />} />
          <Route path="/hr" element={<HR />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Manager Routes — module-specific dashboard */}
        <Route element={<ManagerRoute><ManagerLayout /></ManagerRoute>}>
          <Route path="/manager/projects/sprint" element={<Board />} />
          <Route path="/manager/:moduleKey" element={<ManagerDashboard />} />
          <Route path="/manager/:moduleKey/settings" element={<Settings />} />
          <Route path="/manager/:moduleKey/*" element={<ManagerDashboard />} />
        </Route>

        {/* Employee Routes */}
        <Route element={<EmployeeRoute><EmployeeLayout /></EmployeeRoute>}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/settings" element={<Settings />} />
        </Route>

        {/* Redirects & Fallback */}
        <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
