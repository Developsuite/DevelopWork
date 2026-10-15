import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { permissionsService } from '../../services/permissionsService';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
    const location = useLocation();

    // Don't redirect while still loading session
    if (isLoading) return null;

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Admins have unrestricted access
    if (user.role === 'admin') {
        return children;
    }

    const path = location.pathname;

    // Settings is accessible to all authenticated users (to view and edit their own profile)
    if (path === '/settings') {
        return children;
    }

    // Modules Hub is admin-only
    if (path === '/modules') {
        if (user.role === 'manager' && user.assignedModule) {
            return <Navigate to={`/manager/${user.assignedModule}`} replace />;
        }
        return <Navigate to="/employee/dashboard" replace />;
    }

    // Determine targeted module from URL path
    let targetModule = null;
    if (path.startsWith('/board')) {
        targetModule = 'projects';
    } else {
        targetModule = path.replace(/^\//, '').split('/')[0];
    }

    // Check RBAC permission for this module
    const accessibleModules = permissionsService.getAccessibleModules(user);
    const hasModuleAccess = accessibleModules.some((m) => m.key === targetModule);

    if (hasModuleAccess) {
        return children;
    }

    // If unauthorized, redirect to their respective primary workspace
    if (user.role === 'manager' && user.assignedModule) {
        return <Navigate to={`/manager/${user.assignedModule}`} replace />;
    }

    return <Navigate to="/employee/dashboard" replace />;
};

export default AdminRoute;
