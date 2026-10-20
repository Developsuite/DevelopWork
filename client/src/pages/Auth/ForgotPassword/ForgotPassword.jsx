import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError, clearResetSuccess } from '../../../store/slices/authSlice';
import { isValidEmail, formatAuthError } from '../../../utils/validation';
import { AlertCircle, Loader2 } from 'lucide-react';
import '../Login/Login.css';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { isLoading, error, resetSuccess } = useSelector((state) => state.auth);
    const [email, setEmail] = useState('');
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        dispatch(clearError());
        dispatch(clearResetSuccess());
    }, [dispatch]);

    const handleSubmit = (event) => {
        event.preventDefault();
        setLocalError('');
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setLocalError('Please enter your email address.');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            setLocalError('Please enter a valid email address (e.g., name@example.com).');
            return;
        }

        dispatch(clearError());
        dispatch(clearResetSuccess());
        dispatch(resetPassword({ email: trimmedEmail }));
    };

    const displayError = localError || (error ? formatAuthError(error) : null);

    return (
        <div className="login-page">
            <div className="login-page__brand">
                <div className="login-page__brand-logo">
                    <img src="/images/white_logo.png" alt="DevelopWork" className="logo-img" />
                    DevelopWork
                </div>
                <p className="login-page__brand-tagline">Secure account recovery for your DevelopWork workspace.</p>
            </div>

            <div className="login-page__form-section">
                <div className="login-page__form-container">
                    <h1 className="login-page__form-title">Forgot your password?</h1>
                    <p className="login-page__form-subtitle">
                        {resetSuccess
                            ? 'Check your inbox and spam folder for the secure link.'
                            : "Enter your account email and we'll send a secure reset link."}
                    </p>

                    {displayError && (
                        <div className="login-page__error" role="alert">
                            <AlertCircle size={16} />
                            <span>{displayError}</span>
                        </div>
                    )}

                    {!resetSuccess ? (
                        <form className="login-page__form" onSubmit={handleSubmit}>
                            <div className="login-page__field">
                                <label className="login-page__label" htmlFor="reset-email">Account email</label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    className="login-page__input"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(event) => { setEmail(event.target.value); setLocalError(''); }}
                                    autoComplete="email"
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="login-page__submit" disabled={isLoading}>
                                {isLoading ? <><Loader2 size={16} className="spin-icon" /> Sending…</> : 'Send secure reset link'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-page__success" role="status">
                            <strong>Check your email</strong>
                            <p>If an active DevelopWork account exists for that address, a password reset link has been sent.</p>
                            <button type="button" onClick={() => dispatch(clearResetSuccess())}>Send another link</button>
                        </div>
                    )}

                    <div className="login-page__footer">
                        <Link to="/login">Back to sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
