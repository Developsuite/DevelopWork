export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const trimmed = phone.trim();
    const validPattern = /^[+]?[\d\s\-()]{7,25}$/.test(trimmed);
    const digitsCount = (trimmed.match(/\d/g) || []).length;
    return validPattern && digitsCount >= 7 && digitsCount <= 16;
};

export const isValidPassword = (password) => {
    return password && password.length >= 6;
};

export const isPositiveNumber = (num) => {
    return num !== null && num !== '' && !isNaN(num) && Number(num) >= 0;
};

export const isEmpty = (str) => {
    return !str || str.trim().length === 0;
};

export const formatAuthError = (err) => {
    if (!err) return null;
    const msg = typeof err === 'string' ? err : err.message || '';
    const lower = msg.toLowerCase();

    if (lower.includes('invalid login credentials')) {
        return 'Invalid email or password. Please check your details and try again.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
        return 'An account with this email already exists. Please sign in instead.';
    }
    if (lower.includes('email not confirmed')) {
        return 'Please confirm your email address before signing in, or check your inbox.';
    }
    if (lower.includes('password should be at least') || lower.includes('password is too short')) {
        return 'Password must be at least 6 characters long.';
    }
    if (lower.includes('user not found')) {
        return 'No account found with this email. Please sign up first.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
        return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('err_name_not_resolved')) {
        return 'Unable to reach the server. Please check your internet connection.';
    }
    return msg;
};
