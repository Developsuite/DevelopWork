import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../store/slices/authSlice';
import { mockUser } from '../../../utils/mockData';
import ThemeToggle from '../../../components/common/ThemeToggle/ThemeToggle';
import { Zap, LayoutDashboard, Users, BarChart3, Shield } from 'lucide-react';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock login — just dispatch the success and navigate
        dispatch(loginSuccess(mockUser));
        navigate('/onboarding');
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
            </div>

            {/* Right Form Panel */}
            <div className="login-page__form-section">
                <div className="login-page__theme-toggle">
                    <ThemeToggle />
                </div>
                <div className="login-page__form-container">
                    <h1 className="login-page__form-title">Welcome back</h1>
                    <p className="login-page__form-subtitle">Sign in to your DevelopWork account</p>

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
