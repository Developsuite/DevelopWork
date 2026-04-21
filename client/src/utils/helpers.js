// Helper utilities for DevelopWork

export const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
};

export const generateId = () => {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export const getPriorityColor = (priority) => {
    const colors = {
        critical: '#E2445C',
        high: '#FDAB3D',
        medium: '#579BFC',
        low: '#7C8DB5',
    };
    return colors[priority] || '#7C8DB5';
};

export const getStatusColor = (status, options) => {
    if (!options) return '#6C7A96';
    const option = options.find(o => o.label === status);
    return option ? option.color : '#6C7A96';
};

export const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

export const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ');
};
