import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import { mockUser } from '../../../utils/mockData';
import ThemeToggle from '../../../components/common/ThemeToggle/ThemeToggle';
import { Zap, LayoutDashboard, Users, BarChart3, Shield, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const managers = useSelector((state) => state.access.managers);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Check if admin login
        if (email === mockUser.email) {
            dispatch(loginSuccess({
                ...mockUser,
                role: 'admin',
            }));
            navigate('/modules');
            return;
        }

        // Check if manager login
        const manager = managers.find(
            (m) => m.email === email && m.password === password
        );

        if (manager) {
            dispatch(loginSuccess({
                _id: manager.userId,
                name: manager.name,
                email: manager.email,
                role: 'manager',
                assignedModule: manager.assignedModule,
                managerId: manager.id,
                avatar: null,
            }));
            navigate(`/manager/${manager.assignedModule}`);
            return;
        }

        // Check if email matches a manager but password is wrong
        const managerByEmail = managers.find((m) => m.email === email);
        if (managerByEmail) {
            setError('Incorrect password. Default password is manager123');
            return;
        }

        // No match found — still allow mock admin login for any credentials
        dispatch(loginSuccess({
            ...mockUser,
            role: 'admin',
        }));
        navigate('/modules');
    };

    return (
        <div className="login-page">
            {/* Left Branding Panel */}
            <div className="login-page__brand">
                <div className="login-page__brand-logo">
                    <span className="logo-icon-lg"><Zap size={24} /></span>
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

                {/* Demo credentials hint */}
                <div className="login-page__demo-creds">
                    <div className="login-page__demo-title">
                        <Shield size={14} />
                        Demo Credentials
                    </div>
                    <div className="login-page__demo-row">
                        <span>Admin:</span>
                        <span>abbas@developwork.com (any password)</span>
                    </div>
                    <div className="login-page__demo-row">
                        <span>HR Manager:</span>
                        <span>omar@developwork.com / manager123</span>
                    </div>
                    <div className="login-page__demo-row">
                        <span>Projects Mgr:</span>
                        <span>sarah@developwork.com / manager123</span>
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

                        <button type="submit" className="login-page__submit">
                            Sign In
                        </button>

                        <div className="login-page__divider">or continue with</div>

                        <div className="login-page__social">
                            <button type="button" className="login-page__social-btn">
                                Google
                            </button>
                            <button type="button" className="login-page__social-btn">
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
