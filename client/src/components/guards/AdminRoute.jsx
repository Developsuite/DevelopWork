import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // If a manager tries to access admin pages, redirect them to their dashboard
    if (user.role === 'manager' && user.assignedModule) {
        return <Navigate to={`/manager/${user.assignedModule}`} replace />;
    }

    return children;
};

export default AdminRoute;
