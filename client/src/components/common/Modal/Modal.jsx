import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="dw-modal-overlay" onClick={onClose}>
            <div className="dw-modal-container glass-elevated" onClick={e => e.stopPropagation()}>
                <div className="dw-modal-header">
                    <h2 className="dw-modal-title">{title}</h2>
                    <button className="dw-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="dw-modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="dw-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
