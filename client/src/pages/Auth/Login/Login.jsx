import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithEmail, signInWithGoogle, clearError } from '../../../store/slices/authSlice';
import { addToast } from '../../../store/slices/uiSlice';
import { isValidEmail } from '../../../utils/validation';
import ThemeToggle from '../../../components/common/ThemeToggle/ThemeToggle';
import { Zap, LayoutDashboard, Users, BarChart3, Shield, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading, error, user } = useSelector((state) => state.auth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'manager' && user.assignedModule) {
                navigate(`/manager/${user.assignedModule}`);
            } else if (user.role === 'employee') {
                navigate('/employee/dashboard');
            } else {
                navigate('/modules');
            }
        }
    }, [isAuthenticated, user, navigate]);

    // Clear errors when component mounts
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter both email and password.', type: 'warning' }));
            return;
        }
        if (!isValidEmail(email)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter a valid email address.', type: 'warning' }));
            return;
        }
        dispatch(signInWithEmail({ email, password }));
    };

    const handleGoogleSignIn = () => {
        dispatch(signInWithGoogle());
    };

    return (
        <div className="login-page">
            {/* Left Branding Panel */}
            <div className="login-page__brand">
                <div className="login-page__brand-logo">
                    <img src="/images/white_logo.png" alt="Logo" className="logo-img" />
                    DevelopWork
                </div>
                <p className="login-page__brand-tagline">
                    One platform for every department. Manage projects, HR, finance, and CRM — all in one place.
                </p>
                <div className="login-page__brand-features">
                    <div className="login-page__brand-feature">
                        <span className="login-page__brand-feature-icon"><LayoutDashboard size={18} /></span>
                        Project Management with Kanban & Timeline
                    </div>
                    <div className="login-page__brand-feature">
                        <span className="login-page__brand-feature-icon"><Users size={18} /></span>
                        HR & Recruitment Pipeline
                    </div>
                    <div className="login-page__brand-feature">
                        <span className="login-page__brand-feature-icon"><BarChart3 size={18} /></span>
                        Finance & Budget Tracking
                    </div>
                    <div className="login-page__brand-feature">
                        <span className="login-page__brand-feature-icon"><Shield size={18} /></span>
                        Role-Based Access Control
                    </div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="login-page__form-section">
                <div className="login-page__theme-toggle">
                    <ThemeToggle />
                </div>
                <div className="login-page__form-container">
                    <h1 className="login-page__form-title">Welcome back</h1>
                    <p className="login-page__form-subtitle">Sign in to your DevelopWork account</p>

                    {error && (
                        <div className="login-page__error">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <form className="login-page__form" onSubmit={handleSubmit}>
                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="login-page__input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="login-page__input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="login-page__row">
                            <label className="login-page__checkbox">
                                <input type="checkbox" /> Remember me
                            </label>
                            <Link to="/forgot-password" className="login-page__forgot">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="login-page__submit" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 size={16} className="spin-icon" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="login-page__divider">or continue with</div>

                        <div className="login-page__social">
                            <button
                                type="button"
                                className="login-page__social-btn"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google
                            </button>
                            <button type="button" className="login-page__social-btn" disabled>
                                Microsoft
                            </button>
                        </div>
                    </form>

                    <div className="login-page__footer">
                        Don't have an account? <Link to="/register">Sign up free</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
