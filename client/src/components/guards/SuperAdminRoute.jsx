import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

    if (isLoading) return null;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role !== 'super_admin') return <Navigate to="/" replace />;

    return children;
};

export default SuperAdminRoute;
