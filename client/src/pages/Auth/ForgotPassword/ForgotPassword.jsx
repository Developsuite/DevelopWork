import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError, clearResetSuccess } from '../../../store/slices/authSlice';
import { addToast } from '../../../store/slices/uiSlice';
import { isValidEmail } from '../../../utils/validation';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';
import '../Login/Login.css';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { isLoading, error, resetSuccess } = useSelector((state) => state.auth);
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            dispatch(addToast({ title: 'Validation Error', message: 'Please enter a valid email address.', type: 'warning' }));
            return;
        }
        dispatch(clearError());
        dispatch(clearResetSuccess());
        dispatch(resetPassword({ email }));
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
                        {resetSuccess
                            ? "Check your email for a reset link."
                            : "Enter your email and we'll send you a reset link."}
                    </p>

                    {error && (
                        <div className="login-page__error">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {!resetSuccess ? (
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
                                    disabled={isLoading}
                                />
                            </div>
                            <button type="submit" className="login-page__submit" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 size={16} className="spin-icon" /> Sending...</>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
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
