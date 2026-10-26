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
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
    const [attemptCount, setAttemptCount] = useState(0);

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

    const validateField = (name, value) => {
        if (name === 'email') {
            const trimmed = (value || '').trim();
            if (!trimmed) return 'Please enter your email address.';
            if (!isValidEmail(trimmed)) return 'That doesn\'t look like a valid email. Example: name@company.com';
            return '';
        }
        if (name === 'password') {
            if (!value) return 'Please enter your password.';
            return '';
        }
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        const trimmedEmail = email.trim();
        const emailErr = validateField('email', trimmedEmail);
        const passErr = validateField('password', password);
        if (emailErr || passErr) {
            setFieldErrors({ email: emailErr, password: passErr });
            // Focus the first invalid field so the shake animation + outline is obvious.
            if (emailErr) document.getElementById('email')?.focus();
            else if (passErr) document.getElementById('password')?.focus();
            return;
        }
        setFieldErrors({ email: '', password: '' });
        setAttemptCount((n) => n + 1);
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
                        if (!displayError) return null;
                        const isCredError = /incorrect email or password/i.test(displayError);
                        return (
                            <div className="login-page__error" role="alert" aria-live="assertive" key={attemptCount}>
                                <AlertCircle size={18} />
                                <div className="login-page__error-body">
                                    <strong>{isCredError ? 'Sign-in failed' : 'Something went wrong'}</strong>
                                    <span>{displayError}</span>
                                    {isCredError && (
                                        <small>
                                            Double-check the email and password. If you forgot your password,{' '}
                                            <Link to="/forgot-password" className="login-page__error-link">reset it here</Link>.
                                        </small>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <form className="login-page__form" onSubmit={handleSubmit}>
                        <div className={`login-page__field ${fieldErrors.email ? 'has-error' : ''}`}>
                            <label className="login-page__label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className={`login-page__input ${fieldErrors.email ? 'login-page__input--invalid' : ''}`}
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (localError) setLocalError('');
                                    if (error) dispatch(clearError());
                                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                                }}
                                onBlur={(e) => {
                                    const err = validateField('email', e.target.value);
                                    if (err) setFieldErrors((p) => ({ ...p, email: err }));
                                }}
                                required
                                disabled={isLoading}
                                autoFocus
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                            />
                            {fieldErrors.email && (
                                <span id="email-error" className="login-page__field-error" role="alert">
                                    <AlertCircle size={13} /> {fieldErrors.email}
                                </span>
                            )}
                        </div>

                        <div className={`login-page__field ${fieldErrors.password ? 'has-error' : ''}`}>
                            <label className="login-page__label" htmlFor="password">Password</label>
                            <div className="login-page__password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`login-page__input login-page__input--password ${fieldErrors.password ? 'login-page__input--invalid' : ''}`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (localError) setLocalError('');
                                        if (error) dispatch(clearError());
                                        if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                                    }}
                                    onBlur={(e) => {
                                        const err = validateField('password', e.target.value);
                                        if (err) setFieldErrors((p) => ({ ...p, password: err }));
                                    }}
                                    required
                                    disabled={isLoading}
                                    aria-invalid={!!fieldErrors.password}
                                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
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
                            {fieldErrors.password && (
                                <span id="password-error" className="login-page__field-error" role="alert">
                                    <AlertCircle size={13} /> {fieldErrors.password}
                                </span>
                            )}
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
