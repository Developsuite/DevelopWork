import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ManagerRoute = ({ children }) => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'manager') {
        return <Navigate to="/modules" replace />;
    }

    return children;
};

export default ManagerRoute;
