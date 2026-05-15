import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

    // Don't redirect while still loading session
    if (isLoading) return null;

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // If a manager tries to access admin pages, redirect them to their dashboard
    if (user.role === 'manager' && user.assignedModule) {
        return <Navigate to={`/manager/${user.assignedModule}`} replace />;
    }

    // If an employee tries to access admin pages
    if (user.role === 'employee') {
        return <Navigate to="/employee/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;
