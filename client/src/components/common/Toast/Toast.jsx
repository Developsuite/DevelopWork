import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../../store/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const iconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const ToastItem = ({ toast, onClose }) => {
    const Icon = iconMap[toast.type] || Info;
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const duration = toast.duration || 4200;
    const timerRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const remainingRef = useRef(duration);

    const triggerClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(toast.id);
        }, 260);
    };

    useEffect(() => {
        if (isPaused) {
            clearTimeout(timerRef.current);
            const elapsed = Date.now() - startTimeRef.current;
            remainingRef.current = Math.max(0, remainingRef.current - elapsed);
            return;
        }

        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
            triggerClose();
        }, Math.max(remainingRef.current, 500));

        return () => clearTimeout(timerRef.current);
    }, [isPaused, toast.id]);

    const showTitle = Boolean(
        toast.title &&
        toast.title.trim() !== '' &&
        toast.title.toLowerCase() !== (toast.message || '').toLowerCase()
    );

    return (
        <div 
            className={`dw-toast dw-toast--${toast.type || 'info'} ${isExiting ? 'dw-toast--exiting' : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            role="alert"
        >
            <div className="dw-toast__icon-wrapper">
                <Icon size={16} strokeWidth={2.4} />
            </div>

            <div className="dw-toast__content">
                {showTitle && <div className="dw-toast__title">{toast.title}</div>}
                <div className="dw-toast__message">{toast.message}</div>
            </div>

            <button 
                type="button" 
                className="dw-toast__close" 
                onClick={triggerClose}
                title="Dismiss"
                aria-label="Dismiss notification"
            >
                <X size={14} strokeWidth={2.2} />
            </button>

            <div 
                className={`dw-toast__progress ${isPaused ? 'dw-toast__progress--paused' : ''}`}
                style={{ animationDuration: `${duration}ms` }}
            />
        </div>
    );
};

const ToastContainer = () => {
    const dispatch = useDispatch();
    const toasts = useSelector((state) => state.ui.toasts);

    const handleClose = (id) => {
        dispatch(removeToast(id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
            ))}
        </div>
    );
};

export default ToastContainer;
