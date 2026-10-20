import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, Check, Clock3, Loader2, MailCheck, RotateCcw } from 'lucide-react';
import { resetPassword, clearError, clearResetSuccess } from '../../../store/slices/authSlice';
import { isValidEmail, formatAuthError } from '../../../utils/validation';
import '../Login/Login.css';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const { isResettingPassword, error, resetSuccess } = useSelector((state) => state.auth);
    const [email, setEmail] = useState('');
    const [submittedEmail, setSubmittedEmail] = useState('');
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
        setSubmittedEmail(trimmedEmail);
        dispatch(resetPassword({ email: trimmedEmail }));
    };

    const handleSendAnother = () => {
        dispatch(clearError());
        dispatch(clearResetSuccess());
        setLocalError('');
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
                    <h1 className="login-page__form-title">
                        {resetSuccess ? 'Check your email' : 'Forgot your password?'}
                    </h1>
                    <p className="login-page__form-subtitle">
                        {resetSuccess
                            ? 'Your request was received. Follow the instructions below to continue.'
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
                                    disabled={isResettingPassword}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="login-page__submit" disabled={isResettingPassword}>
                                {isResettingPassword
                                    ? <><Loader2 size={16} className="spin-icon" /> Sending...</>
                                    : 'Send secure reset link'}
                            </button>
                        </form>
                    ) : (
                        <div className="password-reset-sent" role="status" aria-live="polite">
                            <div className="password-reset-sent__icon" aria-hidden="true">
                                <MailCheck size={28} />
                                <span><Check size={12} strokeWidth={3} /></span>
                            </div>
                            <div className="password-reset-sent__header">
                                <strong>Reset email sent</strong>
                                <p>
                                    If an active DevelopWork account exists for
                                    {' '}<span className="password-reset-sent__email">{submittedEmail}</span>,
                                    {' '}a secure reset link is on its way.
                                </p>
                            </div>
                            <ol className="password-reset-sent__steps">
                                <li><span>1</span><p>Open the email titled <strong>Reset your DevelopWork password</strong>.</p></li>
                                <li><span>2</span><p>Click <strong>Choose a new password</strong>.</p></li>
                                <li><span>3</span><p>Create your new password, then return to sign in.</p></li>
                            </ol>
                            <div className="password-reset-sent__note">
                                <Clock3 size={16} />
                                <p>The link expires in one hour and can only be used once. Check Spam or Junk if it does not appear, and wait one minute before requesting another.</p>
                            </div>
                            <button type="button" className="password-reset-sent__resend" onClick={handleSendAnother}>
                                <RotateCcw size={15} /> Send to a different email
                            </button>
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
