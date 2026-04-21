import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import '../Login/Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

    const handleChange = (field) => (e) => {
        setForm({ ...form, [field]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/login');
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
                    Join thousands of teams managing their work across departments in one unified platform.
                </p>
            </div>

            {/* Right Form Panel */}
            <div className="login-page__form-section">
                <div className="login-page__form-container">
                    <h1 className="login-page__form-title">Create account</h1>
                    <p className="login-page__form-subtitle">Start managing your team with DevelopWork</p>

                    <form className="login-page__form" onSubmit={handleSubmit}>
                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                className="login-page__input"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange('name')}
                                required
                            />
                        </div>

                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                type="email"
                                className="login-page__input"
                                placeholder="you@company.com"
                                value={form.email}
                                onChange={handleChange('email')}
                                required
                            />
                        </div>

                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                className="login-page__input"
                                placeholder="Create a strong password"
                                value={form.password}
                                onChange={handleChange('password')}
                                required
                            />
                        </div>

                        <div className="login-page__field">
                            <label className="login-page__label" htmlFor="confirm-password">Confirm Password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                className="login-page__input"
                                placeholder="Confirm your password"
                                value={form.confirmPassword}
                                onChange={handleChange('confirmPassword')}
                                required
                            />
                        </div>

                        <button type="submit" className="login-page__submit">
                            Create Account
                        </button>

                        <div className="login-page__divider">or continue with</div>

                        <div className="login-page__social">
                            <button type="button" className="login-page__social-btn">Google</button>
                            <button type="button" className="login-page__social-btn">Microsoft</button>
                        </div>
                    </form>

                    <div className="login-page__footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
