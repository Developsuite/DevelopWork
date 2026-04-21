import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import '../Login/Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="login-page">
            <div className="login-page__brand">
                <div className="login-page__brand-logo">
                    <span className="logo-icon-lg"><Zap size={24} /></span>
                    DevelopWork
                </div>
                <p className="login-page__brand-tagline">
                    Reset your password and get back to work.
                </p>
            </div>

            <div className="login-page__form-section">
                <div className="login-page__form-container">
                    <h1 className="login-page__form-title">Reset password</h1>
                    <p className="login-page__form-subtitle">
                        {sent
                            ? "Check your email for a reset link."
                            : "Enter your email and we'll send you a reset link."}
                    </p>

                    {!sent ? (
                        <form className="login-page__form" onSubmit={handleSubmit}>
                            <div className="login-page__field">
                                <label className="login-page__label" htmlFor="reset-email">Email</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className="login-page__input"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="login-page__submit">Send Reset Link</button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <p style={{ fontSize: 'var(--font-md)', color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>
                                ✓ Reset link sent!
                            </p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                                Check your inbox for <strong>{email}</strong>
                            </p>
                        </div>
                    )}

                    <div className="login-page__footer">
                        <Link to="/login">← Back to sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
