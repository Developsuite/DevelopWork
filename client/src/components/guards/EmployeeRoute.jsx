import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const EmployeeRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

    if (isLoading) return null;

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'employee') {
        // If they are an admin, send them to modules
        // If they are a manager, send them to their dashboard
        if (user.role === 'manager' && user.assignedModule) {
            return <Navigate to={`/manager/${user.assignedModule}`} replace />;
        }
        return <Navigate to="/modules" replace />;
    }

    return children;
};

export default EmployeeRoute;
