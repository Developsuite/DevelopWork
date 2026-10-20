import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
} from 'lucide-react';
import ThemeToggle from '../../../components/common/ThemeToggle/ThemeToggle';
import { authService } from '../../../services/authService';
import {
    clearPasswordRecoveryState,
    getPasswordRecoveryState,
    isPasswordRecoverySession,
    markPasswordRecoveryReady,
} from '../../../lib/passwordRecovery';
import '../Login/Login.css';
import './ResetPassword.css';

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
    const navigate = useNavigate();
    const completedRef = useRef(false);
    const acceptedRef = useRef(false);
    const [status, setStatus] = useState('checking');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        let invalidTimer;

        const acceptSession = (session) => {
            if (!active || !isPasswordRecoverySession(session)) return false;
            acceptedRef.current = true;
            setStatus('ready');
            return true;
        };

        const recoveryState = getPasswordRecoveryState();
        if (!recoveryState || recoveryState.status === 'error') {
            setStatus('invalid');
            return undefined;
        }

        const { data } = authService.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                markPasswordRecoveryReady(session?.user?.id);
                acceptSession(session);
            } else if (event === 'SIGNED_OUT' && !completedRef.current) {
                setStatus('invalid');
            }
        });

        authService.getSession()
            .then((session) => {
                if (!acceptSession(session) && active) {
                    // URL exchange can finish just after the component mounts.
                    invalidTimer = window.setTimeout(() => {
                        if (active && !acceptedRef.current) setStatus('invalid');
                    }, 5000);
                }
            })
            .catch(() => {
                if (active) setStatus('invalid');
            });

        return () => {
            active = false;
            if (invalidTimer) window.clearTimeout(invalidTimer);
            data?.subscription?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (status !== 'success') return undefined;
        const timer = window.setTimeout(() => {
            navigate('/login', { replace: true, state: { passwordReset: true } });
        }, 1800);
        return () => window.clearTimeout(timer);
    }, [navigate, status]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`);
            return;
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            setError('Include at least one letter and one number.');
            return;
        }
        if (password !== confirmPassword) {
            setError('The passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            const session = await authService.getSession();
            if (!isPasswordRecoverySession(session)) {
                throw new Error('This reset session is no longer valid. Request a new link.');
            }

            await authService.updatePassword(password);
            completedRef.current = true;
            clearPasswordRecoveryState();
            setStatus('success');

            // End every existing session after a credential reset so a stolen
            // refresh token cannot continue to access the account.
            try {
                await authService.signOut('global');
            } catch (signOutError) {
                console.warn('[Auth] Password changed, but global sign-out failed:', signOutError);
                await authService.signOut('local').catch(() => undefined);
            }
        } catch (submitError) {
            setError(submitError.message || 'We could not update your password. Request a new reset link.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderContent = () => {
        if (status === 'checking') {
            return (
                <div className="reset-password__state" role="status">
                    <Loader2 size={28} className="spin-icon" />
                    <strong>Checking your secure link</strong>
                    <span>This should only take a moment.</span>
                </div>
            );
        }

        if (status === 'invalid') {
            return (
                <div className="reset-password__state">
                    <span className="reset-password__state-icon reset-password__state-icon--error"><AlertCircle size={24} /></span>
                    <strong>Reset link expired or invalid</strong>
                    <span>Password links can only be used once and expire for your protection.</span>
                    <Link className="login-page__submit reset-password__action-link" to="/forgot-password">
                        Request a new link
                    </Link>
                    <Link className="reset-password__secondary-link" to="/login">Back to sign in</Link>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="reset-password__state" role="status">
                    <span className="reset-password__state-icon reset-password__state-icon--success"><CheckCircle2 size={26} /></span>
                    <strong>Password updated</strong>
                    <span>Your old sessions have been signed out. Taking you back to sign in…</span>
                </div>
            );
        }

        return (
            <form className="login-page__form" onSubmit={handleSubmit}>
                {error && (
                    <div className="login-page__error" role="alert">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="login-page__field">
                    <label className="login-page__label" htmlFor="new-password">New password</label>
                    <div className="login-page__password-wrapper">
                        <input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            className="login-page__input login-page__input--password"
                            value={password}
                            onChange={(event) => { setPassword(event.target.value); setError(''); }}
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
                            disabled={submitting}
                            autoFocus
                            required
                        />
                        <button type="button" className="login-page__password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="login-page__field">
                    <label className="login-page__label" htmlFor="confirm-new-password">Confirm new password</label>
                    <div className="login-page__password-wrapper">
                        <input
                            id="confirm-new-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="login-page__input login-page__input--password"
                            value={confirmPassword}
                            onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }}
                            autoComplete="new-password"
                            minLength={MIN_PASSWORD_LENGTH}
                            disabled={submitting}
                            required
                        />
                        <button type="button" className="login-page__password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="reset-password__requirements" aria-label="Password requirements">
                    <span className={password.length >= MIN_PASSWORD_LENGTH ? 'met' : ''}><Check size={14} /> At least {MIN_PASSWORD_LENGTH} characters</span>
                    <span className={/[A-Za-z]/.test(password) && /\d/.test(password) ? 'met' : ''}><Check size={14} /> Includes a letter and a number</span>
                </div>

                <button type="submit" className="login-page__submit" disabled={submitting}>
                    {submitting ? <><Loader2 size={16} className="spin-icon" /> Updating password…</> : 'Update password'}
                </button>
            </form>
        );
    };

    return (
        <div className="login-page">
            <div className="login-page__brand">
                <div className="login-page__brand-logo">
                    <img src="/images/white_logo.png" alt="DevelopWork" className="logo-img" />
                    DevelopWork
                </div>
                <p className="login-page__brand-tagline">Secure account recovery for every workspace role.</p>
            </div>

            <div className="login-page__form-section">
                <div className="login-page__theme-toggle"><ThemeToggle /></div>
                <div className="login-page__form-container">
                    <span className="reset-password__eyebrow"><KeyRound size={15} /> Account recovery</span>
                    <h1 className="login-page__form-title">Choose a new password</h1>
                    <p className="login-page__form-subtitle">This secure link authorizes one password change for your account.</p>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
