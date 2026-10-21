import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signInWithEmail, clearError } from '../../../store/slices/authSlice';
import { isValidEmail, formatAuthError } from '../../../utils/validation';
import ThemeToggle from '../../../components/common/ThemeToggle/ThemeToggle';
import { LayoutDashboard, Users, BarChart3, Shield, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading, error, user } = useSelector((state) => state.auth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'super_admin') {
                navigate('/super-admin');
            } else if (user.role === 'manager' && user.assignedModule) {
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
        setLocalError('');
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            setLocalError('Please enter both your email address and password.');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            setLocalError('Please enter a valid email address (e.g., name@example.com).');
            return;
        }
        dispatch(signInWithEmail({ email: trimmedEmail, password }));
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
                    <div className="login-page__mobile-brand">
                        <img src="/images/logo.png" alt="DevelopWork" />
                        <span>DevelopWork</span>
                    </div>
                    <h1 className="login-page__form-title">Welcome back</h1>
                    <p className="login-page__form-subtitle">Sign in to your DevelopWork account</p>

                    {location.state?.passwordReset && (
                        <div className="login-page__success login-page__success--compact" role="status">
                            <strong>Password updated</strong>
                            <p>Sign in with your new password.</p>
                        </div>
                    )}

                    {(() => {
                        const displayError = localError || (error ? formatAuthError(error) : null);
                        return displayError ? (
                            <div className="login-page__error">
                                <AlertCircle size={16} />
                                <span>{displayError}</span>
                            </div>
                        ) : null;
                    })()}

                    <form className="login-page__form" onSubmit={handleSubmit}>
                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="login-page__input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (localError) setLocalError('');
                                    if (error) dispatch(clearError());
                                }}
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="password">Password</label>
                            <div className="login-page__password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="login-page__input login-page__input--password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (localError) setLocalError('');
                                        if (error) dispatch(clearError());
                                    }}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="login-page__password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
                    </form>

                    <div className="login-page__footer">
                        Need an account? Ask your workspace administrator for access.
                        <span className="login-page__footer-contact">
                            Contact: <a href="tel:+923269906907">0326 9906907</a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
