import { getPriorityColor } from '../../../utils/helpers';
import './Badge.css';

const Badge = ({ children, variant = 'default', color, className = '' }) => {
    const style = color ? { backgroundColor: color } : {};

    return (
        <span
            className={`dw-badge dw-badge--${variant} ${className}`}
            style={style}
        >
            {children}
        </span>
    );
};

export const StatusBadge = ({ status, color }) => (
    <Badge variant="status" color={color}>{status}</Badge>
);

export const PriorityBadge = ({ priority }) => (
    <Badge variant="priority" color={getPriorityColor(priority)}>
        {priority}
    </Badge>
);

// Tag color palette — each tag gets a unique color based on its name
const tagColorMap = {
    'UI': '#6366F1',
    'Design': '#EC4899',
    'Backend': '#10B981',
    'Testing': '#F97316',
    'Frontend': '#3B82F6',
    'DevOps': '#8B5CF6',
    'API': '#D97706',
    'Database': '#0EA5E9',
    'Security': '#EF4444',
    'Performance': '#059669',
};

const fallbackColors = ['#6366F1', '#EC4899', '#10B981', '#F97316', '#8B5CF6', '#0EA5E9'];

const getTagBaseColor = (tag) => {
    if (tagColorMap[tag]) return tagColorMap[tag];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return fallbackColors[Math.abs(hash) % fallbackColors.length];
};

// Convert hex to rgba
const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const TagBadge = ({ tag }) => {
    const baseColor = getTagBaseColor(tag);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bg = isDark ? hexToRgba(baseColor, 0.15) : hexToRgba(baseColor, 0.1);
    const borderColor = isDark ? hexToRgba(baseColor, 0.25) : hexToRgba(baseColor, 0.15);

    return (
        <span
            className="dw-badge dw-badge--tag"
            style={{ background: bg, color: baseColor, borderColor }}
        >
            {tag}
        </span>
    );
};

export const RoleBadge = ({ role, color }) => (
    <Badge variant="role" color={color}>{role}</Badge>
);

export default Badge;
