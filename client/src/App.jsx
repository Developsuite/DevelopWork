import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AppLayout from './components/layout/AppLayout/AppLayout';
import ManagerLayout from './components/layout/ManagerLayout/ManagerLayout';
import AdminRoute from './components/guards/AdminRoute';
import ManagerRoute from './components/guards/ManagerRoute';
import Login from './pages/Auth/Login/Login';
import Register from './pages/Auth/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import Board from './pages/Board/Board';
import HR from './pages/HR/HR';
import Finance from './pages/Finance/Finance';
import ModuleHub from './pages/ModuleHub/ModuleHub';
import Onboarding from './pages/Onboarding/Onboarding';
import ProjectManagement from './pages/ProjectManagement/ProjectManagement';
import Leads from './pages/Leads/Leads';
import Support from './pages/Support/Support';
import Docs from './pages/Docs/Docs';
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound/NotFound';

function App() {
  const theme = useSelector((state) => state.ui.theme);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Apply theme attribute to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Smart redirect for root path based on role
  const getRootRedirect = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.role === 'manager' && user.assignedModule) {
      return `/manager/${user.assignedModule}`;
    }
    return '/modules';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
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
          <Route path="/support" element={<Support />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Manager Routes — module-specific dashboard */}
        <Route element={<ManagerRoute><ManagerLayout /></ManagerRoute>}>
          <Route path="/manager/:moduleKey" element={<ManagerDashboard />} />
          <Route path="/manager/:moduleKey/*" element={<ManagerDashboard />} />
        </Route>

        {/* Redirects & Fallback */}
        <Route path="/" element={<Navigate to={getRootRedirect()} replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
