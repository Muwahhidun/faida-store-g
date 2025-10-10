import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Декодирует JWT токен без проверки подписи (только для чтения payload)
 */
const decodeJWT = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

/**
 * Компонент для защиты маршрутов админ-панели.
 * Проверяет авторизацию и роль пользователя (admin или moderator).
 * Используется для /panel, создания/редактирования новостей и вакансий.
 *
 * Для страниц, доступных всем авторизованным пользователям (например, /profile),
 * используйте AuthenticatedRoute.
 */
const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Декодируем токен и проверяем роль
    const payload = decodeJWT(token);

    if (!payload) {
        // Если токен невалидный, редиректим на логин
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return <Navigate to="/login" replace />;
    }

    // Проверяем, что пользователь - админ или модератор
    const userRole = payload.role || 'user';
    const isAdmin = userRole === 'admin' || userRole === 'moderator';

    if (!isAdmin) {
        // Обычные пользователи не имеют доступа к админ-панели
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-12 w-12 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
                    <p className="text-gray-600 mb-6">
                        У вас нет прав для доступа к админ-панели. Эта страница доступна только администраторам и модераторам.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Вернуться на главную
                    </button>
                </div>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
