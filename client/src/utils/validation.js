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
    return Boolean(password && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password));
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
    const code = typeof err === 'object' ? (err.code || err.error_code || '') : '';
    const lower = `${msg} ${code}`.toLowerCase();

    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials') || lower.includes('invalid_grant')) {
        return 'Incorrect email or password. Please try again.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('user_already_exists')) {
        return 'An account with this email already exists. Please sign in instead.';
    }
    if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
        return 'Please confirm your email address before signing in, or check your inbox.';
    }
    if (lower.includes('password should be at least') || lower.includes('password is too short') || lower.includes('weak_password')) {
        return 'Password must be at least 6 characters.';
    }
    if (lower.includes('user not found') || lower.includes('user_not_found')) {
        return 'No account found with this email. Please contact your administrator.';
    }
    if (lower.includes('user is banned') || lower.includes('user_banned')) {
        return 'This account has been suspended. Please contact your administrator.';
    }
    if (lower.includes('invalid email') || lower.includes('email_address_invalid')) {
        return 'Please enter a valid email address.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_request_rate_limit')) {
        return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('err_name_not_resolved')) {
        return 'Unable to reach the server. Please check your internet connection.';
    }
    // Clean fallback — never show raw technical/stack text to the user.
    if (!msg || msg.length > 120 || /auth(api)?error|{|}|at\s|http|undefined|null/i.test(msg)) {
        return 'Something went wrong. Please try again.';
    }
    return msg;
};
