import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button/Button';
import './NotFound.css';

const NotFound = () => (
    <div className="not-found">
        <div className="not-found__content">
            <div className="not-found__logo">
                <Zap size={32} />
                DevelopWork
            </div>
            <h1 className="not-found__code">404</h1>
            <p className="not-found__title">Page not found</p>
            <p className="not-found__text">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/dashboard">
                <Button variant="primary" icon={ArrowLeft}>
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    </div>
);

export default NotFound;
