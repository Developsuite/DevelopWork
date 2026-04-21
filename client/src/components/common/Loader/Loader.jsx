import { Loader2 } from 'lucide-react';
import './Loader.css';

const Loader = ({ size = 24, fullPage = false, className = '' }) => (
    <div className={`dw-loader ${fullPage ? 'dw-loader--full' : ''} ${className}`}>
        <Loader2 className="dw-spinner" size={size} />
    </div>
);

export const Skeleton = ({ variant = 'text', width, height, className = '' }) => (
    <div
        className={`dw-skeleton dw-skeleton--${variant} ${className}`}
        style={{ width, height }}
    />
);

export default Loader;
