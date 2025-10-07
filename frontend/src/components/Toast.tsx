import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

/**
 * Toast уведомление
 * Появляется в правом верхнем углу, не сдвигает контент
 */
export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = type === 'success' ? FaCheckCircle : FaExclamationTriangle;
    const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';

    return (
        <div
            className={`
                fixed top-4 right-4 z-50
                ${bgColor} ${borderColor} ${textColor}
                border rounded-lg shadow-lg
                px-4 py-3 pr-10
                max-w-md w-auto
                animate-slide-in-right
                flex items-start space-x-3
            `}
            role="alert"
        >
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className={`
                    absolute top-2 right-2
                    p-1 rounded
                    ${type === 'success' ? 'hover:bg-green-100' : 'hover:bg-red-100'}
                    transition-colors
                `}
                aria-label="Закрыть"
            >
                <FaTimes className="w-4 h-4" />
            </button>
        </div>
    );
};
