import { getInitials } from '../../../utils/helpers';
import './Avatar.css';

const AVATAR_COLORS = [
    '#579BFC', '#FDAB3D', '#00C875', '#A25DDC', '#E2445C',
    '#FF642E', '#037F4C', '#0086C0', '#9D99B9', '#CAB641',
];

const getColorFromName = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Avatar = ({ name, src, size = 'md', className = '' }) => {
    const classes = `dw-avatar dw-avatar--${size} ${className}`;

    if (src) {
        return (
            <div className={classes}>
                <img src={src} alt={name || 'User'} />
            </div>
        );
    }

    return (
        <div
            className={`${classes} dw-avatar--initials`}
            style={{ backgroundColor: getColorFromName(name) }}
            title={name}
        >
            {getInitials(name)}
        </div>
    );
};

export default Avatar;
