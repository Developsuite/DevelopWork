import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../../store/slices/uiSlice';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

const ToastItem = ({ toast, onClose }) => {
    const Icon = iconMap[toast.type] || Info;

    useEffect(() => {
        const timer = setTimeout(() => onClose(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    return (
        <div className={`dw-toast dw-toast--${toast.type}`}>
            <span className="dw-toast__icon"><Icon size={18} /></span>
            <span className="dw-toast__message">{toast.message}</span>
            <button className="dw-toast__close" onClick={() => onClose(toast.id)}>
                <X size={14} />
            </button>
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
        <div className="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={handleClose} />
            ))}
        </div>
    );
};

export default ToastContainer;
