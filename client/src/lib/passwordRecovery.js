const PASSWORD_RECOVERY_KEY = 'developwork.password-recovery';
const RECOVERY_WINDOW_MS = 60 * 60 * 1000;

const canUseBrowserStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

const readUrlParameters = () => {
    if (typeof window === 'undefined') return new URLSearchParams();

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    hashParams.forEach((value, key) => {
        if (!params.has(key)) params.set(key, value);
    });
    return params;
};

const decodeJwtSubject = (token) => {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
        return decoded.sub || null;
    } catch {
        return null;
    }
};

const writeRecoveryState = (state) => {
    if (!canUseBrowserStorage()) return;
    window.sessionStorage.setItem(PASSWORD_RECOVERY_KEY, JSON.stringify(state));
};

export const getPasswordRecoveryState = () => {
    if (!canUseBrowserStorage()) return null;

    try {
        const value = JSON.parse(window.sessionStorage.getItem(PASSWORD_RECOVERY_KEY));
        if (!value?.startedAt || Date.now() - value.startedAt > RECOVERY_WINDOW_MS) {
            window.sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
            return null;
        }
        return value;
    } catch {
        window.sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
        return null;
    }
};

export const capturePasswordRecoveryIntent = () => {
    if (!canUseBrowserStorage() || window.location.pathname !== '/reset-password') return;

    const params = readUrlParameters();
    const recoveryType = params.get('type');
    const hasRecoveryCredentials = recoveryType === 'recovery'
        || Boolean(params.get('code'))
        || Boolean(params.get('access_token'));
    const urlError = params.get('error') || params.get('error_code');

    if (!hasRecoveryCredentials && !urlError) return;

    writeRecoveryState({
        startedAt: Date.now(),
        status: urlError ? 'error' : 'pending',
        expectedUserId: decodeJwtSubject(params.get('access_token') || ''),
    });
};

export const markPasswordRecoveryReady = (userId) => {
    const current = getPasswordRecoveryState();
    writeRecoveryState({
        startedAt: current?.startedAt || Date.now(),
        status: 'ready',
        expectedUserId: current?.expectedUserId || userId || null,
        userId: userId || null,
    });
};

export const isPasswordRecoverySession = (session) => {
    const state = getPasswordRecoveryState();
    const sessionUserId = session?.user?.id;
    if (!state || state.status === 'error' || !sessionUserId) return false;

    if (state.status === 'ready') {
        return !state.userId || state.userId === sessionUserId;
    }

    return Boolean(state.expectedUserId && state.expectedUserId === sessionUserId);
};

export const clearPasswordRecoveryState = () => {
    if (canUseBrowserStorage()) window.sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
};
