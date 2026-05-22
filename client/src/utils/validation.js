export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
