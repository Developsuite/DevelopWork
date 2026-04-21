import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight,
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const classes = [
        'dw-button',
        `dw-button--${variant}`,
        size !== 'md' && `dw-button--${size}`,
        fullWidth && 'dw-button--full',
        !children && Icon && 'dw-button--icon',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} disabled={disabled || loading} {...props}>
            {loading ? (
                <Loader2 className="button-spinner" size={16} />
            ) : Icon && !iconRight ? (
                <Icon size={16} />
            ) : null}
            {children}
            {Icon && iconRight && !loading && <Icon size={16} />}
        </button>
    );
};

export default Button;
