import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { restoreSession, setUser } from './store/slices/authSlice';
import { authService } from './services/authService';
import { permissionsService } from './services/permissionsService';
import { supabase } from './lib/supabase';
import AppLayout from './components/layout/AppLayout/AppLayout';
import ManagerLayout from './components/layout/ManagerLayout/ManagerLayout';
import EmployeeLayout from './components/layout/EmployeeLayout/EmployeeLayout';
import ToastContainer from './components/common/Toast/Toast';
import AICommandCenter from './components/common/AICommandCenter/AICommandCenter';
import AdminRoute from './components/guards/AdminRoute';
import ManagerRoute from './components/guards/ManagerRoute';
import EmployeeRoute from './components/guards/EmployeeRoute';
import SuperAdminRoute from './components/guards/SuperAdminRoute';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';
import Board from './pages/Board/Board';
import HR from './pages/HR/HR';
import Finance from './pages/Finance/Finance';
import ModuleHub from './pages/ModuleHub/ModuleHub';
import Dashboard from './pages/Dashboard/Dashboard';
import Onboarding from './pages/Onboarding/Onboarding';
import Landing from './pages/Landing/Landing';
import ProjectManagement from './pages/ProjectManagement/ProjectManagement';
import TaskManagement from './pages/TaskManagement/TaskManagement';
import Leads from './pages/Leads/Leads';
import Clients from './pages/Clients/Clients';
import Docs from './pages/Docs/Docs';
import Meetings from './pages/Meetings/Meetings';
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard/EmployeeDashboard';
import Settings from './pages/Settings/Settings';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';
import NotFound from './pages/NotFound/NotFound';
import { Loader2 } from 'lucide-react';

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const existingUserId = useRef(null);

  // Apply theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Mirror the current user id in a ref so the auth-state handler (set up once) can tell
  // whether Redux already holds a usable user without listing `user` as a hook dep.
  useEffect(() => {
    existingUserId.current = user?.id || user?._id || null;
  }, [user]);

  // We rely on Supabase JS's built-in autoRefreshToken timer to keep the access token
  // fresh. Our previous custom keepalive (visibility + focus + 5-min interval) added
  // many extra getSession() + refreshSession() calls on top of that, which for some
  // employees snowballed into /auth/v1/token being rate-limited (429) and then auto
  // logging them out. The autoRefreshToken timer alone is enough and is already gated
  // internally by Supabase. The retry-fetch wrapper in lib/supabase.js is the only
  // on-demand refresh path we need.

  // Restore Supabase session on app load and listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    let subscription = null;
    let authRevision = 0;

    // 1. Explicitly restore session first to avoid Strict Mode missed events
    dispatch(restoreSession()).finally(() => {
      if (!isMounted) return; // Safely prevent memory leaks if component unmounted

      // authService defers this handler until Supabase releases its session lock.
      const { data } = authService.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State change event:', event);
        
        // Skip INITIAL_SESSION since restoreSession already handles the initial load
        if (event === 'INITIAL_SESSION') return;

        // Skip TOKEN_REFRESHED — token was renewed in background, user profile has not changed.
        // Re-fetching profile and calling setUser here causes unnecessary re-renders and UI locks!
        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed in background; maintaining active session state');
          return;
        }

        // Recovery sessions may update credentials only. Do not turn them
        // into an authenticated application session before the reset ends.
        if (event === 'PASSWORD_RECOVERY') {
          authRevision += 1;
          if (isMounted) dispatch(setUser(null));
          return;
        }

        if (
          window.location.pathname === '/reset-password'
          && session
          && (event === 'SIGNED_IN' || event === 'USER_UPDATED')
        ) {
          authRevision += 1;
          if (isMounted) dispatch(setUser(null));
          return;
        }

        // ONLY clear user on an explicit sign-out.
        if (event === 'SIGNED_OUT') {
          authRevision += 1;
          if (isMounted) dispatch(setUser(null));
          return;
        }

        if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Supabase fires SIGNED_IN on EVERY session touch, including background token
          // refreshes. Re-fetching the profile each time causes a thundering herd (429 on
          // the refresh_token endpoint + a 406/profile loop) and makes dependent effects
          // like EmployeeDashboard's task-loader restart continuously. If the user is
          // already loaded for this exact session user id, trust the data we have and
          // skip the fetch. We still fetch for USER_UPDATED, since that signals an
          // intentional change the UI should pick up.
          if (event === 'SIGNED_IN' && existingUserId.current === session.user.id) {
            return;
          }
          const revision = ++authRevision;
          let profile = null;
          try {
            profile = await authService.getProfile(session.user.id);
          } catch (err) {
            console.error('[Auth] Failed to re-load profile for session user:', err);
          }
          if (!isMounted || revision !== authRevision) return;
          if (profile) {
            dispatch(setUser({
              id: profile.id,
              _id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              assignedModule: profile.assigned_module,
              permissions: profile.permissions || [],
              department: profile.department,
              avatar: profile.avatar_url,
              phone: profile.phone,
              location: profile.location,
              jobTitle: profile.job_title || localStorage.getItem(`dw-profile-job-title-${profile.id}`) || 'Product Lead',
              bio: profile.bio || localStorage.getItem(`dw-profile-bio-${profile.id}`) || 'Building the future of work management.',
            }));
          } else if (existingUserId.current !== session.user.id) {
            // No profile row yet AND no good user in Redux — minimal fallback with safe role.
            dispatch(setUser({
              id: session.user.id,
              _id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              role: session.user.user_metadata?.role || 'employee',
            }));
          }
        }
      });
      subscription = data.subscription;
    });

    return () => {
      isMounted = false;
      authRevision += 1;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [dispatch]);

  // Smart redirect for root path based on role
  const getRootRedirect = () => {
    if (!isAuthenticated || !user) return '/landing';
    if (user.role === 'super_admin') return '/super-admin';
    if (user.role === 'manager') {
      const accessibleModules = permissionsService.getAccessibleModules(user);
      const firstMod = accessibleModules[0]?.key || 'projects';
      return `/manager/${firstMod}`;
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
      {isAuthenticated && user && <AICommandCenter />}
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        {/* Public self-registration is disabled — only the Super Admin provisions workspaces */}
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/onboarding" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Super Admin Console */}
        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />

        {/* Admin / Full App Routes (with Layout) */}
        <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
          <Route path="/modules" element={<ModuleHub />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board/:boardId" element={<Board />} />
          <Route path="/hr" element={<HR />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/meetings" element={<Meetings />} />
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
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
